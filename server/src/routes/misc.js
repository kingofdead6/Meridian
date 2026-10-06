import { Router } from 'express';
import Contact from '../models/Contact.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Employee from '../models/Employee.js';
import { can } from '../config/permissions.js';
import { dashboard } from '../services/reports.js';
import { askAssistant } from '../services/assistant.js';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const dashboardRouter = Router();
dashboardRouter.get('/', async (req, res) => res.json(await dashboard(req.user.company)));

// Global search for the command palette, limited to modules the role can open
export const searchRouter = Router();
searchRouter.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  const rx = { $regex: escape(q), $options: 'i' };
  const company = req.user.company;
  const role = req.user.role;
  const jobs = [];

  if (can(role, ['crm', 'sales', 'purchasing'])) {
    jobs.push(Contact.find({ company, $or: [{ name: rx }, { email: rx }] }).limit(5).lean()
      .then((r) => r.map((c) => ({ type: 'Contact', id: c._id, title: c.name, subtitle: c.type, to: `/contacts?open=${c._id}` }))));
  }
  if (can(role, ['inventory', 'sales', 'purchasing'])) {
    jobs.push(Product.find({ company, $or: [{ name: rx }, { sku: rx }] }).limit(5).lean()
      .then((r) => r.map((p) => ({ type: 'Product', id: p._id, title: p.name, subtitle: p.sku, to: `/products?open=${p._id}` }))));
  }
  if (can(role, ['sales', 'purchasing', 'accounting'])) {
    jobs.push(Invoice.find({ company, number: rx }).limit(5).populate('contact', 'name').lean()
      .then((r) => r.map((i) => ({ type: i.kind === 'customer' ? 'Invoice' : 'Bill', id: i._id, title: i.number, subtitle: i.contact?.name, to: `/${i.kind === 'customer' ? 'sales/invoices' : 'purchases/bills'}/${i._id}` }))));
    jobs.push(Order.find({ company, number: rx }).limit(5).populate('contact', 'name').lean()
      .then((r) => r.map((o) => ({ type: o.kind === 'sale' ? 'Sales order' : 'Purchase order', id: o._id, title: o.number, subtitle: o.contact?.name, to: `/${o.kind === 'sale' ? 'sales/orders' : 'purchases/orders'}/${o._id}` }))));
  }
  if (can(role, 'hr')) {
    jobs.push(Employee.find({ company, $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] }).limit(5).lean()
      .then((r) => r.map((e) => ({ type: 'Employee', id: e._id, title: `${e.firstName} ${e.lastName}`, subtitle: e.position, to: `/hr/employees?open=${e._id}` }))));
  }
  res.json((await Promise.all(jobs)).flat());
});

export const assistantRouter = Router();
assistantRouter.post('/', async (req, res) => {
  const answer = await askAssistant(req.user, req.body?.question, req.body?.history || []);
  res.json({ answer });
});
