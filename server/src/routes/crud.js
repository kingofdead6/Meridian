import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

const PROTECTED = ['_id', 'company', 'user', 'createdAt', 'updatedAt', '__v'];
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const clean = (body, extraProtected = []) =>
  Object.fromEntries(Object.entries(body || {}).filter(([k]) => !PROTECTED.includes(k) && !extraProtected.includes(k)));

export function listQuery(req, { searchFields = [], filterFields = [] }) {
  const filter = { company: req.user.company };
  const q = (req.query.q || '').trim();
  if (q && searchFields.length) filter.$or = searchFields.map((f) => ({ [f]: { $regex: escape(q), $options: 'i' } }));
  for (const f of filterFields) {
    const v = req.query[f];
    if (v !== undefined && v !== '') filter[f] = v.includes(',') ? { $in: v.split(',') } : v;
  }
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(`${req.query.to}T23:59:59`);
  }
  return filter;
}

export async function paginate(Model, filter, req, { populate = '', sort = '-createdAt', select } = {}) {
  const limit = Math.min(Number(req.query.limit) || 25, 500);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const [data, total] = await Promise.all([
    Model.find(filter, select).populate(populate).sort(req.query.sort || sort).skip((page - 1) * limit).limit(limit),
    Model.countDocuments(filter),
  ]);
  return { data, total, page, pages: Math.max(Math.ceil(total / limit), 1) };
}

/**
 * Standard company-scoped REST resource: list/search/filter, read, create, update, delete,
 * with permission checks and audit entries.
 */
export function crudRouter(Model, opts) {
  const {
    entity, modules, searchFields = ['name'], filterFields = [], populate = '', sort = '-createdAt',
    label = (d) => d.name || d.title || d.number, beforeCreate, beforeUpdate, beforeDelete, afterList, readOnly = [],
  } = opts;
  const router = Router();
  if (modules) router.use(authorize(modules));

  router.get('/', async (req, res) => {
    const result = await paginate(Model, listQuery(req, { searchFields, filterFields }), req, { populate, sort });
    if (afterList) result.data = await afterList(result.data, req);
    res.json(result);
  });

  router.get('/:id', async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, company: req.user.company }).populate(populate);
    if (!doc) throw ApiError.notFound(entity);
    res.json(doc);
  });

  router.post('/', async (req, res) => {
    const data = { ...clean(req.body, readOnly), company: req.user.company };
    if (beforeCreate) await beforeCreate(data, req);
    const doc = await Model.create(data);
    audit(req, 'create', entity, doc._id, `Created ${entity.toLowerCase()} ${label(doc) || ''}`.trim());
    res.status(201).json(await doc.populate(populate));
  });

  router.put('/:id', async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, company: req.user.company });
    if (!doc) throw ApiError.notFound(entity);
    const data = clean(req.body, readOnly);
    if (beforeUpdate) await beforeUpdate(doc, data, req);
    doc.set(data);
    await doc.save();
    audit(req, 'update', entity, doc._id, `Updated ${entity.toLowerCase()} ${label(doc) || ''}`.trim());
    res.json(await doc.populate(populate));
  });

  router.delete('/:id', async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, company: req.user.company });
    if (!doc) throw ApiError.notFound(entity);
    if (beforeDelete) await beforeDelete(doc, req);
    await doc.deleteOne();
    audit(req, 'delete', entity, doc._id, `Deleted ${entity.toLowerCase()} ${label(doc) || ''}`.trim());
    res.json({ ok: true });
  });

  return router;
}
