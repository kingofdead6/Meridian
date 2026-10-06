import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Contact from '../models/Contact.js';
import Company from '../models/Company.js';
import ApiError from '../utils/ApiError.js';
import { nextNumber } from '../utils/numbering.js';
import { round2 } from '../utils/money.js';
import { runInTransaction } from '../utils/transaction.js';
import { defaultWarehouse, moveStock } from './inventory.js';
import { postEntry, systemAccounts } from './ledger.js';

export const EDITABLE_FIELDS = ['contact', 'date', 'expectedDate', 'warehouse', 'lines', 'notes'];

export async function productMap(company, lines, session = null) {
  const ids = lines.map((l) => l.product).filter(Boolean);
  const products = await Product.find({ company, _id: { $in: ids } }).session(session);
  return new Map(products.map((p) => [String(p._id), p]));
}

export const isGoods = (line, products) => line.product && products.get(String(line.product))?.type === 'goods';

export async function createOrder(user, data) {
  const kind = data.kind === 'purchase' ? 'purchase' : 'sale';
  const number = await nextNumber(user.company, kind);
  const warehouse = data.warehouse || (await defaultWarehouse(user.company))._id;
  const payload = Object.fromEntries(EDITABLE_FIELDS.filter((f) => data[f] !== undefined).map((f) => [f, data[f]]));
  return Order.create({ ...payload, warehouse, kind, number, company: user.company, user: user._id });
}

export async function confirmOrder(order) {
  if (order.status !== 'draft') throw ApiError.conflict('Only drafts can be confirmed');
  order.status = 'confirmed';
  return order.save();
}

export async function cancelOrder(order) {
  if (!['draft', 'confirmed'].includes(order.status)) throw ApiError.conflict('Delivered or invoiced orders cannot be cancelled');
  order.status = 'cancelled';
  return order.save();
}

/** Delivers a sales order (stock out + COGS) or receives a purchase order (stock in + GRNI). */
export async function fulfillOrder(orderId, { user, warehouse, date } = {}) {
  return runInTransaction(async (session) => {
    const order = await Order.findOne({ _id: orderId, company: user.company }).session(session);
    if (!order) throw ApiError.notFound('Order');
    if (order.status !== 'confirmed') throw ApiError.conflict('Confirm the order before fulfilling it');
    const wh = warehouse || order.warehouse || (await defaultWarehouse(user.company, session))._id;
    const when = date ? new Date(date) : new Date();
    const products = await productMap(user.company, order.lines, session);
    const isSale = order.kind === 'sale';
    let value = 0;

    for (const line of order.lines) {
      if (!isGoods(line, products)) continue;
      const res = await moveStock(
        {
          company: user.company,
          product: line.product,
          warehouse: wh,
          quantity: isSale ? -line.quantity : line.quantity,
          unitCost: isSale ? undefined : round2(line.subtotal / line.quantity),
          type: isSale ? 'delivery' : 'receipt',
          reference: order.number,
          sourceType: 'order',
          sourceId: order._id,
          user: user._id,
          date: when,
        },
        session
      );
      if (res) value += res.cost;
    }

    value = round2(value);
    if (value > 0) {
      const acc = await systemAccounts(user.company, session);
      await postEntry(
        {
          company: user.company, date: when, user: user._id, source: 'stock', sourceId: order._id, reference: order.number,
          memo: isSale ? `Goods delivered for ${order.number}` : `Goods received for ${order.number}`,
          lines: isSale
            ? [{ account: acc.cogs, debit: value }, { account: acc.inventory, credit: value }]
            : [{ account: acc.inventory, debit: value }, { account: acc.grni, credit: value }],
        },
        session
      );
    }

    order.status = 'fulfilled';
    order.warehouse = wh;
    order.fulfilledAt = when;
    await order.save({ session });
    return order;
  });
}

export async function invoiceOrder(orderId, { user, date } = {}) {
  return runInTransaction(async (session) => {
    const order = await Order.findOne({ _id: orderId, company: user.company }).session(session);
    if (!order) throw ApiError.notFound('Order');
    const products = await productMap(user.company, order.lines, session);
    const hasGoods = order.lines.some((l) => isGoods(l, products));
    const ready = order.status === 'fulfilled' || (order.status === 'confirmed' && !hasGoods);
    if (!ready) throw ApiError.conflict(hasGoods ? 'Deliver or receive the goods before invoicing' : 'Confirm the order first');

    const kind = order.kind === 'sale' ? 'customer' : 'supplier';
    const company = await Company.findById(user.company).session(session);
    const contact = await Contact.findById(order.contact).session(session);
    const when = date ? new Date(date) : new Date();
    const terms = contact?.paymentTermsDays ?? company?.paymentTermsDays ?? 30;
    const dueDate = new Date(when.getTime() + terms * 86400000);

    const [invoice] = await Invoice.create(
      [{
        company: user.company,
        kind,
        number: await nextNumber(user.company, kind, session),
        contact: order.contact,
        order: order._id,
        date: when,
        dueDate,
        lines: order.lines.map(({ product, description, quantity, unitPrice, discount, taxRate }) => ({ product, description, quantity, unitPrice, discount, taxRate })),
        notes: kind === 'customer' ? company?.invoiceNote : undefined,
        user: user._id,
      }],
      { session }
    );
    order.status = 'invoiced';
    order.invoice = invoice._id;
    await order.save({ session });
    return invoice;
  });
}
