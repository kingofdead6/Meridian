import { Router } from 'express';
import Lead, { STAGES } from '../models/Lead.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollRun from '../models/PayrollRun.js';
import Project from '../models/Project.js';
import Task, { TASK_STATUSES } from '../models/Task.js';
import { authorize } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';
import { nextNumber } from '../utils/numbering.js';
import { crudRouter, listQuery, paginate } from './crud.js';
import { generatePayroll, postPayroll } from '../services/payroll.js';

/** Shared handler for kanban drag & drop: moves a card to a column and renumbers that column. */
const moveHandler = (Model, field, allowed, entity) => async (req, res) => {
  const doc = await Model.findOne({ _id: req.params.id, company: req.user.company });
  if (!doc) throw ApiError.notFound(entity);
  const { [field]: to, position = 0, scope } = req.body || {};
  if (!allowed.includes(to)) throw ApiError.badRequest('Unknown column');
  const filter = { company: req.user.company, [field]: to, _id: { $ne: doc._id } };
  if (scope) filter[scope] = doc[scope];
  const siblings = await Model.find(filter).sort('position');
  siblings.splice(Math.max(0, Math.min(position, siblings.length)), 0, doc);
  const from = doc[field];
  doc[field] = to;
  await Promise.all(siblings.map((d, i) => { d.position = i; return d.save(); }));
  if (from !== to) audit(req, 'move', entity, doc._id, `Moved "${doc.title}" to ${to.replace('_', ' ')}`);
  res.json(doc);
};

/* ---------- CRM ---------- */
export const leadsRouter = crudRouter(Lead, {
  entity: 'Lead',
  modules: 'crm',
  searchFields: ['title', 'contactName', 'organization', 'email'],
  filterFields: ['stage', 'owner', 'source'],
  populate: { path: 'owner', select: 'name avatar' },
  sort: 'position',
});
leadsRouter.patch('/:id/move', moveHandler(Lead, 'stage', STAGES, 'Lead'));

/* ---------- HR ---------- */
export const departmentsRouter = crudRouter(Department, {
  entity: 'Department',
  modules: 'hr',
  sort: 'name',
  afterList: async (rows, req) => {
    const counts = await Employee.aggregate([
      { $match: { company: req.user.company, status: { $ne: 'terminated' } } },
      { $group: { _id: '$department', count: { $sum: 1 }, payroll: { $sum: '$salary' } } },
    ]);
    return rows.map((r) => {
      const c = counts.find((x) => String(x._id) === String(r._id));
      return { ...r.toObject(), headcount: c?.count || 0, payroll: c?.payroll || 0 };
    });
  },
  beforeDelete: async (doc) => {
    if (await Employee.exists({ department: doc._id })) throw ApiError.conflict('Move employees out of this department first');
  },
});

export const employeesRouter = crudRouter(Employee, {
  entity: 'Employee',
  modules: 'hr',
  searchFields: ['firstName', 'lastName', 'email', 'position', 'employeeNo'],
  filterFields: ['department', 'status'],
  populate: { path: 'department', select: 'name color' },
  sort: 'lastName',
  label: (d) => `${d.firstName} ${d.lastName}`,
  beforeCreate: async (data, req) => {
    if (!data.employeeNo) data.employeeNo = await nextNumber(req.user.company, 'employee');
  },
});

export const leavesRouter = Router();
leavesRouter.use(authorize('hr'));
const leavePopulate = { path: 'employee', select: 'firstName lastName avatar position leaveBalance' };

leavesRouter.get('/', async (req, res) => {
  const filter = listQuery(req, { filterFields: ['status', 'employee', 'type'] });
  delete filter.date;
  res.json(await paginate(LeaveRequest, filter, req, { populate: leavePopulate, sort: '-startDate' }));
});

leavesRouter.post('/', async (req, res) => {
  const { employee, type, startDate, endDate, reason } = req.body || {};
  const emp = await Employee.findOne({ _id: employee, company: req.user.company });
  if (!emp) throw ApiError.notFound('Employee');
  const leave = await LeaveRequest.create({ company: req.user.company, employee, type, startDate, endDate, reason });
  audit(req, 'create', 'Leave', leave._id, `Leave requested for ${emp.fullName} (${leave.days} days)`);
  res.status(201).json(await leave.populate(leavePopulate));
});

leavesRouter.patch('/:id/:decision', async (req, res) => {
  const { decision } = req.params;
  if (!['approve', 'reject'].includes(decision)) throw ApiError.badRequest('Unknown decision');
  const leave = await LeaveRequest.findOne({ _id: req.params.id, company: req.user.company }).populate('employee');
  if (!leave) throw ApiError.notFound('Leave request');
  if (leave.status !== 'pending') throw ApiError.conflict('This request has already been reviewed');
  if (decision === 'approve' && leave.type === 'annual') {
    if (leave.employee.leaveBalance < leave.days) throw ApiError.badRequest(`Only ${leave.employee.leaveBalance} days of annual leave left`);
    leave.employee.leaveBalance -= leave.days;
    await leave.employee.save();
  }
  leave.status = decision === 'approve' ? 'approved' : 'rejected';
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();
  audit(req, decision, 'Leave', leave._id, `${leave.status === 'approved' ? 'Approved' : 'Rejected'} leave for ${leave.employee.fullName}`);
  res.json(await leave.populate(leavePopulate));
});

leavesRouter.delete('/:id', async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, company: req.user.company });
  if (!leave) throw ApiError.notFound('Leave request');
  if (leave.status !== 'pending') throw ApiError.conflict('Only pending requests can be withdrawn');
  await leave.deleteOne();
  res.json({ ok: true });
});

export const payrollRouter = Router();
payrollRouter.use(authorize(['hr', 'accounting']));

payrollRouter.get('/', async (req, res) => {
  const filter = listQuery(req, { filterFields: ['status'] });
  res.json(await paginate(PayrollRun, filter, req, { sort: '-period', select: '-lines' }));
});

payrollRouter.get('/:id', async (req, res) => {
  const run = await PayrollRun.findOne({ _id: req.params.id, company: req.user.company })
    .populate('paidFrom', 'name code').populate('journalEntry', 'number').populate('lines.employee', 'avatar employeeNo');
  if (!run) throw ApiError.notFound('Payroll run');
  res.json(run);
});

payrollRouter.post('/', async (req, res) => {
  const run = await generatePayroll(req.body?.period, { user: req.user });
  audit(req, 'create', 'Payroll', run._id, `Prepared payroll ${run.period}`);
  res.status(201).json(run);
});

payrollRouter.post('/:id/post', async (req, res) => {
  const run = await postPayroll(req.params.id, { user: req.user, account: req.body?.account });
  audit(req, 'post', 'Payroll', run._id, `Posted payroll ${run.period}`);
  res.json(run);
});

payrollRouter.delete('/:id', async (req, res) => {
  const run = await PayrollRun.findOne({ _id: req.params.id, company: req.user.company });
  if (!run) throw ApiError.notFound('Payroll run');
  if (run.status !== 'draft') throw ApiError.conflict('Posted payroll cannot be deleted');
  await run.deleteOne();
  res.json({ ok: true });
});

/* ---------- Projects ---------- */
export const projectsRouter = crudRouter(Project, {
  entity: 'Project',
  modules: 'projects',
  searchFields: ['name', 'description'],
  filterFields: ['status', 'client'],
  populate: { path: 'client', select: 'name' },
  sort: '-createdAt',
  afterList: async (rows, req) => {
    const stats = await Task.aggregate([
      { $match: { company: req.user.company, project: { $in: rows.map((r) => r._id) } } },
      { $group: { _id: '$project', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]);
    return rows.map((r) => {
      const s = stats.find((x) => String(x._id) === String(r._id));
      return { ...r.toObject(), taskCount: s?.total || 0, doneCount: s?.done || 0 };
    });
  },
  beforeDelete: async (doc) => { await Task.deleteMany({ project: doc._id }); },
});

export const tasksRouter = crudRouter(Task, {
  entity: 'Task',
  modules: 'projects',
  searchFields: ['title', 'description'],
  filterFields: ['project', 'status', 'assignee', 'priority'],
  populate: { path: 'assignee', select: 'name avatar' },
  sort: 'position',
  label: (d) => d.title,
});
tasksRouter.patch('/:id/move', moveHandler(Task, 'status', TASK_STATUSES, 'Task'));
