import { Router } from 'express';
import Contact from '../models/Contact.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import StockLevel from '../models/StockLevel.js';
import StockMove from '../models/StockMove.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import { authorize } from '../middleware/auth.js';
import { crudRouter, listQuery, paginate } from './crud.js';
import { adjustStock, transferStock } from '../services/inventory.js';
import { runInTransaction } from '../utils/transaction.js';
import { audit } from '../utils/audit.js';
import { round2 } from '../utils/money.js';
import ApiError from '../utils/ApiError.js';

export const contactsRouter = crudRouter(Contact, {
  entity: 'Contact',
  modules: ['crm', 'sales', 'purchasing', 'accounting'],
  searchFields: ['name', 'email', 'contactPerson', 'city'],
  filterFields: ['type', 'active'],
  sort: 'name',
  // Attach open balances (what they owe us / what we owe them)
  afterList: async (rows, req) => {
    const ids = rows.map((r) => r._id);
    const open = await Invoice.aggregate([
      { $match: { company: req.user.company, contact: { $in: ids }, status: { $in: ['posted', 'partial'] } } },
      { $group: { _id: { contact: '$contact', kind: '$kind' }, total: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
    ]);
    return rows.map((r) => {
      const o = r.toObject();
      o.receivable = round2(open.find((x) => String(x._id.contact) === String(r._id) && x._id.kind === 'customer')?.total || 0);
      o.payable = round2(open.find((x) => String(x._id.contact) === String(r._id) && x._id.kind === 'supplier')?.total || 0);
      return o;
    });
  },
  beforeDelete: async (doc) => {
    if (await Invoice.exists({ contact: doc._id }) || await Order.exists({ contact: doc._id })) {
      throw ApiError.conflict('This contact has documents. Mark it inactive instead.');
    }
  },
});

export const productsRouter = crudRouter(Product, {
  entity: 'Product',
  modules: ['inventory', 'sales', 'purchasing'],
  searchFields: ['name', 'sku', 'category', 'barcode'],
  filterFields: ['type', 'category', 'active'],
  sort: 'name',
  readOnly: ['avgCost'],
  label: (d) => `${d.sku} ${d.name}`,
  afterList: async (rows, req) => {
    const levels = await StockLevel.aggregate([
      { $match: { company: req.user.company, product: { $in: rows.map((r) => r._id) } } },
      { $group: { _id: '$product', quantity: { $sum: '$quantity' } } },
    ]);
    const map = new Map(levels.map((l) => [String(l._id), l.quantity]));
    return rows.map((r) => ({ ...r.toObject(), stock: map.get(String(r._id)) || 0 }));
  },
  beforeDelete: async (doc) => {
    if (await StockMove.exists({ product: doc._id }) || await Invoice.exists({ 'lines.product': doc._id })) {
      throw ApiError.conflict('This product has history. Mark it inactive instead.');
    }
  },
});

export const warehousesRouter = crudRouter(Warehouse, {
  entity: 'Warehouse',
  modules: ['inventory', 'sales', 'purchasing'],
  searchFields: ['name', 'code'],
  sort: 'name',
  beforeCreate: async (data, req) => {
    if (data.isDefault) await Warehouse.updateMany({ company: req.user.company }, { isDefault: false });
  },
  beforeUpdate: async (doc, data, req) => {
    if (data.isDefault) await Warehouse.updateMany({ company: req.user.company, _id: { $ne: doc._id } }, { isDefault: false });
  },
  beforeDelete: async (doc) => {
    if (await StockLevel.exists({ warehouse: doc._id, quantity: { $ne: 0 } })) throw ApiError.conflict('Move the stock out of this warehouse first');
  },
});

export const inventoryRouter = Router();
inventoryRouter.use(authorize(['inventory', 'purchasing', 'sales']));

inventoryRouter.get('/levels', async (req, res) => {
  const filter = { company: req.user.company };
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  const levels = await StockLevel.find(filter).populate('product', 'name sku unit avgCost reorderLevel image category').populate('warehouse', 'name code').lean();
  const q = (req.query.q || '').toLowerCase();
  const rows = levels
    .filter((l) => l.product && (!q || l.product.name.toLowerCase().includes(q) || l.product.sku.toLowerCase().includes(q)))
    .map((l) => ({ ...l, value: round2(l.quantity * l.product.avgCost) }))
    .sort((a, b) => a.product.name.localeCompare(b.product.name));
  res.json({ data: rows, total: rows.length, totalValue: round2(rows.reduce((s, r) => s + r.value, 0)) });
});

inventoryRouter.get('/moves', async (req, res) => {
  const filter = listQuery(req, { searchFields: ['reference', 'note'], filterFields: ['product', 'warehouse', 'type'] });
  res.json(await paginate(StockMove, filter, req, { populate: [{ path: 'product', select: 'name sku unit' }, { path: 'warehouse', select: 'name code' }], sort: '-date' }));
});

inventoryRouter.post('/adjust', authorize('inventory'), async (req, res) => {
  const { product, warehouse, quantity, reason } = req.body || {};
  if (!product || !warehouse || !Number(quantity)) throw ApiError.badRequest('Choose a product, a warehouse and a non-zero quantity');
  const move = await runInTransaction((session) =>
    adjustStock({ company: req.user.company, product, warehouse, quantity: Number(quantity), reason, user: req.user._id }, session)
  );
  audit(req, 'adjust', 'Stock', move._id, `Adjusted stock by ${quantity}${reason ? ` (${reason})` : ''}`);
  res.status(201).json(move);
});

inventoryRouter.post('/transfer', authorize('inventory'), async (req, res) => {
  const { product, from, to, quantity, note } = req.body || {};
  const move = await runInTransaction((session) =>
    transferStock({ company: req.user.company, product, from, to, quantity, note, user: req.user._id }, session)
  );
  audit(req, 'transfer', 'Stock', move._id, `Transferred ${quantity} units between warehouses`);
  res.status(201).json(move);
});
