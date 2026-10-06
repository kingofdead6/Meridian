import { Router } from 'express';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';
import { authorize } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';
import { clean, listQuery, paginate } from './crud.js';
import { balancesByAccount, naturalBalance, postEntry, reverseEntry } from '../services/ledger.js';
import { runInTransaction } from '../utils/transaction.js';
import * as reports from '../services/reports.js';

/* ---------- Chart of accounts ---------- */
export const accountsRouter = Router();

// Cash & bank accounts are readable by anyone who records payments
accountsRouter.get('/cash', async (req, res) => {
  res.json(await Account.find({ company: req.user.company, isCash: true, active: true }).sort('code'));
});

accountsRouter.use(authorize(['accounting', 'reports']));

accountsRouter.get('/', async (req, res) => {
  const filter = listQuery(req, { searchFields: ['name', 'code'], filterFields: ['type', 'isCash', 'active'] });
  const [accounts, balances] = await Promise.all([Account.find(filter).sort('code').lean(), balancesByAccount(req.user.company)]);
  const data = accounts.map((a) => ({ ...a, balance: naturalBalance(a.type, balances.get(String(a._id))) }));
  res.json({ data, total: data.length, page: 1, pages: 1 });
});

accountsRouter.get('/:id', async (req, res) => {
  const acc = await Account.findOne({ _id: req.params.id, company: req.user.company });
  if (!acc) throw ApiError.notFound('Account');
  res.json(acc);
});

accountsRouter.get('/:id/ledger', async (req, res) => {
  const result = await reports.accountLedger(req.user.company, req.params.id, req.query);
  if (!result) throw ApiError.notFound('Account');
  res.json(result);
});

accountsRouter.post('/', authorize('accounting'), async (req, res) => {
  const { systemKey, ...data } = clean(req.body);
  const acc = await Account.create({ ...data, company: req.user.company });
  audit(req, 'create', 'Account', acc._id, `Created account ${acc.code} ${acc.name}`);
  res.status(201).json(acc);
});

accountsRouter.put('/:id', authorize('accounting'), async (req, res) => {
  const acc = await Account.findOne({ _id: req.params.id, company: req.user.company });
  if (!acc) throw ApiError.notFound('Account');
  const { systemKey, type, ...data } = clean(req.body);
  if (type && type !== acc.type) {
    if (await JournalEntry.exists({ 'lines.account': acc._id })) throw ApiError.conflict('The type of an account with postings cannot change');
    acc.type = type;
  }
  acc.set(data);
  await acc.save();
  audit(req, 'update', 'Account', acc._id, `Updated account ${acc.code}`);
  res.json(acc);
});

accountsRouter.delete('/:id', authorize('accounting'), async (req, res) => {
  const acc = await Account.findOne({ _id: req.params.id, company: req.user.company });
  if (!acc) throw ApiError.notFound('Account');
  if (acc.systemKey) throw ApiError.conflict('System accounts are used by automatic postings and cannot be deleted');
  if (await JournalEntry.exists({ 'lines.account': acc._id })) throw ApiError.conflict('This account has postings. Deactivate it instead.');
  await acc.deleteOne();
  audit(req, 'delete', 'Account', acc._id, `Deleted account ${acc.code}`);
  res.json({ ok: true });
});

/* ---------- Journal ---------- */
export const journalRouter = Router();
journalRouter.use(authorize(['accounting', 'reports']));

const linePopulate = { path: 'lines.account', select: 'code name type' };

journalRouter.get('/', async (req, res) => {
  const filter = listQuery(req, { searchFields: ['number', 'memo', 'reference'], filterFields: ['source', 'status'] });
  res.json(await paginate(JournalEntry, filter, req, { populate: linePopulate, sort: '-date -createdAt' }));
});

journalRouter.get('/:id', async (req, res) => {
  const entry = await JournalEntry.findOne({ _id: req.params.id, company: req.user.company })
    .populate(linePopulate).populate('user', 'name').populate('reversalOf reversedBy', 'number');
  if (!entry) throw ApiError.notFound('Journal entry');
  res.json(entry);
});

journalRouter.post('/', authorize('accounting'), async (req, res) => {
  const { date, memo, reference, lines } = req.body || {};
  if (!Array.isArray(lines) || lines.length < 2) throw ApiError.badRequest('An entry needs at least two lines');
  const ids = [...new Set(lines.map((l) => String(l.account)))];
  const count = await Account.countDocuments({ company: req.user.company, _id: { $in: ids } });
  if (count !== ids.length) throw ApiError.badRequest('One of the accounts does not exist');
  const entry = await postEntry({ company: req.user.company, date: date || new Date(), memo, reference, source: 'manual', lines, user: req.user._id });
  audit(req, 'create', 'JournalEntry', entry._id, `Posted manual entry ${entry.number}`);
  res.status(201).json(entry);
});

journalRouter.post('/:id/reverse', authorize('accounting'), async (req, res) => {
  const entry = await JournalEntry.findOne({ _id: req.params.id, company: req.user.company });
  if (!entry) throw ApiError.notFound('Journal entry');
  if (entry.source !== 'manual' && entry.source !== 'opening') {
    throw ApiError.conflict('Automatic entries are reversed by voiding their source document');
  }
  const reversal = await runInTransaction((s) => reverseEntry(entry._id, { user: req.user._id, date: req.body?.date }, s));
  audit(req, 'reverse', 'JournalEntry', entry._id, `Reversed ${entry.number}`);
  res.json(reversal);
});

/* ---------- Reports ---------- */
export const reportsRouter = Router();
reportsRouter.use(authorize(['accounting', 'reports']));
reportsRouter.get('/trial-balance', async (req, res) => res.json(await reports.trialBalance(req.user.company, req.query)));
reportsRouter.get('/profit-loss', async (req, res) => res.json(await reports.profitLoss(req.user.company, req.query)));
reportsRouter.get('/balance-sheet', async (req, res) => res.json(await reports.balanceSheet(req.user.company, req.query)));
