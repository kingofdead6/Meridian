import { Router } from 'express';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Company from '../models/Company.js';
import { can } from '../config/permissions.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';
import { listQuery, paginate } from './crud.js';
import * as orders from '../services/orders.js';
import * as invoices from '../services/invoices.js';
import { recordPayment } from '../services/payments.js';
import { invoicePdf } from '../services/pdf.js';

const docPopulate = [
  { path: 'contact', select: 'name email phone address city country taxId' },
  { path: 'lines.product', select: 'name sku unit type image' },
];
const orderPopulate = [...docPopulate, { path: 'warehouse', select: 'name code' }];

const orderModule = (kind) => (kind === 'purchase' ? 'purchasing' : 'sales');
const invoiceModule = (kind) => (kind === 'supplier' ? 'purchasing' : 'sales');
const ensure = (req, module) => {
  if (!can(req.user.role, [module, 'accounting'])) throw ApiError.forbidden();
};

/* ---------- Orders (sales + purchase) ---------- */
export const ordersRouter = Router();

async function loadOrder(req) {
  const order = await Order.findOne({ _id: req.params.id, company: req.user.company });
  if (!order) throw ApiError.notFound('Order');
  ensure(req, orderModule(order.kind));
  return order;
}

ordersRouter.get('/', async (req, res) => {
  const kind = req.query.kind === 'purchase' ? 'purchase' : 'sale';
  ensure(req, orderModule(kind));
  const filter = { ...listQuery(req, { searchFields: ['number', 'notes'], filterFields: ['status', 'contact'] }), kind };
  res.json(await paginate(Order, filter, req, { populate: { path: 'contact', select: 'name' }, sort: '-date' }));
});

ordersRouter.get('/:id', async (req, res) => {
  const order = await loadOrder(req);
  await order.populate([...orderPopulate, { path: 'invoice', select: 'number status' }]);
  res.json(order);
});

ordersRouter.post('/', async (req, res) => {
  ensure(req, orderModule(req.body?.kind));
  const order = await orders.createOrder(req.user, req.body || {});
  audit(req, 'create', 'Order', order._id, `Created ${order.kind} order ${order.number}`);
  res.status(201).json(order);
});

ordersRouter.put('/:id', async (req, res) => {
  const order = await loadOrder(req);
  if (order.status !== 'draft') throw ApiError.conflict('Only drafts can be edited');
  for (const f of orders.EDITABLE_FIELDS) if (req.body[f] !== undefined) order[f] = req.body[f];
  await order.save();
  audit(req, 'update', 'Order', order._id, `Updated ${order.number}`);
  res.json(await order.populate(orderPopulate));
});

ordersRouter.delete('/:id', async (req, res) => {
  const order = await loadOrder(req);
  if (order.status !== 'draft' && order.status !== 'cancelled') throw ApiError.conflict('Only drafts or cancelled orders can be deleted');
  await order.deleteOne();
  audit(req, 'delete', 'Order', order._id, `Deleted ${order.number}`);
  res.json({ ok: true });
});

const orderAction = (name, fn, verb) =>
  ordersRouter.post(`/:id/${name}`, async (req, res) => {
    const order = await loadOrder(req);
    const result = await fn(order, req);
    audit(req, name, 'Order', order._id, `${verb} ${order.number}`);
    res.json(result);
  });

orderAction('confirm', (o) => orders.confirmOrder(o), 'Confirmed');
orderAction('cancel', (o) => orders.cancelOrder(o), 'Cancelled');
orderAction('fulfill', (o, req) => orders.fulfillOrder(o._id, { user: req.user, warehouse: req.body?.warehouse, date: req.body?.date }), 'Fulfilled');
orderAction('invoice', (o, req) => orders.invoiceOrder(o._id, { user: req.user, date: req.body?.date }), 'Invoiced');

/* ---------- Invoices & bills ---------- */
export const invoicesRouter = Router();

async function loadInvoice(req) {
  const inv = await Invoice.findOne({ _id: req.params.id, company: req.user.company });
  if (!inv) throw ApiError.notFound('Invoice');
  ensure(req, invoiceModule(inv.kind));
  return inv;
}

invoicesRouter.get('/', async (req, res) => {
  const kind = req.query.kind === 'supplier' ? 'supplier' : 'customer';
  ensure(req, invoiceModule(kind));
  const filter = { ...listQuery(req, { searchFields: ['number', 'supplierReference'], filterFields: ['status', 'contact'] }), kind };
  if (req.query.overdue === 'true') {
    filter.status = { $in: ['posted', 'partial'] };
    filter.dueDate = { $lt: new Date() };
  }
  res.json(await paginate(Invoice, filter, req, { populate: { path: 'contact', select: 'name' }, sort: '-date' }));
});

invoicesRouter.get('/:id', async (req, res) => {
  const inv = await loadInvoice(req);
  await inv.populate([...docPopulate, { path: 'order', select: 'number' }, { path: 'journalEntry', select: 'number' }]);
  const payments = await Payment.find({ invoice: inv._id }).populate('account', 'name code').sort('date');
  res.json({ ...inv.toJSON(), payments });
});

invoicesRouter.get('/:id/pdf', async (req, res) => {
  const inv = await loadInvoice(req);
  await inv.populate(docPopulate);
  const company = await Company.findById(req.user.company);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${inv.number}.pdf"`);
  await invoicePdf(res, inv, company);
});

invoicesRouter.post('/', async (req, res) => {
  ensure(req, invoiceModule(req.body?.kind));
  const inv = await invoices.createInvoice(req.user, req.body || {});
  audit(req, 'create', 'Invoice', inv._id, `Created ${inv.kind === 'customer' ? 'invoice' : 'bill'} ${inv.number}`);
  res.status(201).json(inv);
});

invoicesRouter.put('/:id', async (req, res) => {
  const inv = await loadInvoice(req);
  // Attachments can be managed at any stage; everything else only while draft
  if (req.body.attachments !== undefined) inv.attachments = req.body.attachments;
  const editsContent = invoices.EDITABLE_FIELDS.some((f) => req.body[f] !== undefined);
  if (editsContent) {
    if (inv.status !== 'draft') throw ApiError.conflict('Posted documents cannot be edited. Void it and create a new one.');
    for (const f of invoices.EDITABLE_FIELDS) if (req.body[f] !== undefined) inv[f] = req.body[f];
  }
  await inv.save();
  audit(req, 'update', 'Invoice', inv._id, `Updated ${inv.number}`);
  res.json(await inv.populate(docPopulate));
});

invoicesRouter.delete('/:id', async (req, res) => {
  const inv = await loadInvoice(req);
  if (inv.status !== 'draft') throw ApiError.conflict('Only drafts can be deleted. Void posted documents instead.');
  if (inv.order) await Order.updateOne({ _id: inv.order }, { status: 'fulfilled', $unset: { invoice: 1 } });
  await inv.deleteOne();
  audit(req, 'delete', 'Invoice', inv._id, `Deleted draft ${inv.number}`);
  res.json({ ok: true });
});

invoicesRouter.post('/:id/post', async (req, res) => {
  const inv = await loadInvoice(req);
  const result = await invoices.postInvoice(inv._id, { user: req.user });
  audit(req, 'post', 'Invoice', inv._id, `Posted ${inv.number}`);
  res.json(result);
});

invoicesRouter.post('/:id/void', async (req, res) => {
  const inv = await loadInvoice(req);
  const result = await invoices.voidInvoice(inv._id, { user: req.user });
  audit(req, 'void', 'Invoice', inv._id, `Voided ${inv.number}`);
  res.json(result);
});

/* ---------- Payments ---------- */
export const paymentsRouter = Router();

paymentsRouter.get('/', async (req, res) => {
  const kind = req.query.kind;
  if (kind) ensure(req, kind === 'out' ? 'purchasing' : 'sales');
  else ensure(req, 'accounting');
  const filter = listQuery(req, { searchFields: ['number', 'reference'], filterFields: ['kind', 'method', 'contact', 'account'] });
  res.json(await paginate(Payment, filter, req, {
    populate: [{ path: 'contact', select: 'name' }, { path: 'invoice', select: 'number kind' }, { path: 'account', select: 'name code' }],
    sort: '-date',
  }));
});

paymentsRouter.post('/', async (req, res) => {
  const inv = await Invoice.findOne({ _id: req.body?.invoice, company: req.user.company });
  if (!inv) throw ApiError.notFound('Invoice');
  ensure(req, invoiceModule(inv.kind));
  const payment = await recordPayment(req.body, { user: req.user });
  audit(req, 'create', 'Payment', payment._id, `Recorded ${payment.number} of ${payment.amount} for ${inv.number}`);
  res.status(201).json(payment);
});
