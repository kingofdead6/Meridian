import { Router } from 'express';
import Company from '../models/Company.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authorize } from '../middleware/auth.js';
import { clean, crudRouter, paginate, listQuery } from './crud.js';
import { audit } from '../utils/audit.js';
import ApiError from '../utils/ApiError.js';

export const companyRouter = Router();
companyRouter.get('/', async (req, res) => res.json(await Company.findById(req.user.company)));
companyRouter.put('/', authorize('settings'), async (req, res) => {
  const company = await Company.findById(req.user.company);
  company.set(clean(req.body));
  await company.save();
  audit(req, 'update', 'Company', company._id, 'Updated company settings');
  res.json(company);
});

export const usersRouter = crudRouter(User, {
  entity: 'User',
  modules: 'settings',
  searchFields: ['name', 'email'],
  filterFields: ['role', 'active'],
  sort: 'name',
  beforeUpdate: async (doc, data, req) => {
    if (String(doc._id) === String(req.user._id) && (data.role && data.role !== 'admin')) throw ApiError.badRequest('You cannot remove your own admin role');
    if (!data.password) delete data.password;
  },
  beforeDelete: async (doc, req) => {
    if (String(doc._id) === String(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');
  },
});

export const auditRouter = Router();
auditRouter.get('/', authorize('settings'), async (req, res) => {
  res.json(await paginate(AuditLog, listQuery(req, { searchFields: ['summary', 'userName', 'entity'], filterFields: ['entity', 'action'] }), req));
});

// Lightweight list of colleagues for owner / assignee pickers, open to every role
export const directoryRouter = Router();
directoryRouter.get('/', async (req, res) => {
  const data = await User.find({ company: req.user.company, active: true }).select('name avatar role').sort('name');
  res.json({ data, total: data.length, page: 1, pages: 1 });
});
