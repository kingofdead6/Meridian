import mongoose from 'mongoose';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';
import Invoice from '../models/Invoice.js';
import '../models/Contact.js';
import Product from '../models/Product.js';
import StockLevel from '../models/StockLevel.js';
import Lead from '../models/Lead.js';
import AuditLog from '../models/AuditLog.js';
import { balancesByAccount, naturalBalance } from './ledger.js';
import { round2 } from '../utils/money.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const sum = (rows, key = 'balance') => round2(rows.reduce((s, r) => s + r[key], 0));

async function accountsWith(company, range) {
  const [accounts, balances] = await Promise.all([Account.find({ company }).sort('code').lean(), balancesByAccount(company, range)]);
  return accounts.map((a) => {
    const b = balances.get(String(a._id)) || { debit: 0, credit: 0 };
    return { ...a, debit: b.debit, credit: b.credit, balance: naturalBalance(a.type, b) };
  });
}

export async function trialBalance(company, { from, to } = {}) {
  const rows = (await accountsWith(company, { from, to: to && endOfDay(to) })).filter((r) => r.debit || r.credit);
  const out = rows.map((r) => {
    const net = round2(r.debit - r.credit);
    return { _id: r._id, code: r.code, name: r.name, type: r.type, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
  });
  return { rows: out, totalDebit: sum(out, 'debit'), totalCredit: sum(out, 'credit') };
}

export async function profitLoss(company, { from, to } = {}) {
  const rows = await accountsWith(company, { from, to: to && endOfDay(to) });
  const income = rows.filter((r) => r.type === 'income' && r.balance !== 0);
  const expenses = rows.filter((r) => r.type === 'expense' && r.balance !== 0);
  const cogs = expenses.filter((r) => r.systemKey === 'cogs');
  const operating = expenses.filter((r) => r.systemKey !== 'cogs');
  const totalIncome = sum(income);
  const totalCogs = sum(cogs);
  const totalOperating = sum(operating);
  return {
    income, cogs, operating, totalIncome, totalCogs, totalOperating,
    grossProfit: round2(totalIncome - totalCogs),
    netProfit: round2(totalIncome - totalCogs - totalOperating),
  };
}

export async function balanceSheet(company, { asOf } = {}) {
  const rows = await accountsWith(company, { to: endOfDay(asOf || new Date()) });
  const pick = (type) => rows.filter((r) => r.type === type && r.balance !== 0);
  const assets = pick('asset');
  const liabilities = pick('liability');
  const equity = pick('equity');
  const earnings = round2(sum(rows.filter((r) => r.type === 'income')) - sum(rows.filter((r) => r.type === 'expense')));
  const totalAssets = sum(assets);
  const totalLiabilities = sum(liabilities);
  const totalEquity = round2(sum(equity) + earnings);
  return {
    assets, liabilities, equity, currentEarnings: earnings, totalAssets, totalLiabilities, totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}

export async function accountLedger(company, accountId, { from, to } = {}) {
  const account = await Account.findOne({ _id: accountId, company }).lean();
  if (!account) return null;
  let opening = 0;
  if (from) {
    const before = await balancesByAccount(company, { to: new Date(new Date(from).getTime() - 1) });
    opening = naturalBalance(account.type, before.get(String(account._id)));
  }
  const match = { company: oid(company), 'lines.account': oid(accountId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = endOfDay(to);
  }
  const entries = await JournalEntry.find(match).sort({ date: 1, createdAt: 1 }).limit(1000).lean();
  let running = opening;
  const debitNormal = account.type === 'asset' || account.type === 'expense';
  const rows = [];
  for (const e of entries) {
    for (const l of e.lines) {
      if (String(l.account) !== String(accountId)) continue;
      running = round2(running + (debitNormal ? l.debit - l.credit : l.credit - l.debit));
      rows.push({ entryId: e._id, number: e.number, date: e.date, memo: l.description || e.memo, source: e.source, debit: l.debit, credit: l.credit, balance: running });
    }
  }
  return { account, opening, closing: running, rows };
}

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function dashboard(company) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const cid = oid(company);

  const accounts = await Account.find({ company }).lean();
  const typeOf = new Map(accounts.map((a) => [String(a._id), a.type]));
  const cashIds = accounts.filter((a) => a.isCash).map((a) => String(a._id));

  // Income & expenses per month for the last six months
  const monthly = await JournalEntry.aggregate([
    { $match: { company: cid, date: { $gte: sixMonthsAgo } } },
    { $unwind: '$lines' },
    { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' }, account: '$lines.account' }, debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);
  const series = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    series.push({ key: monthKey(d), label: d.toLocaleString('en', { month: 'short' }), income: 0, expenses: 0 });
  }
  const byKey = new Map(series.map((s) => [s.key, s]));
  for (const r of monthly) {
    const s = byKey.get(`${r._id.y}-${String(r._id.m).padStart(2, '0')}`);
    const type = typeOf.get(String(r._id.account));
    if (!s) continue;
    if (type === 'income') s.income = round2(s.income + r.credit - r.debit);
    if (type === 'expense') s.expenses = round2(s.expenses + r.debit - r.credit);
  }
  series.forEach((s) => { s.profit = round2(s.income - s.expenses); });

  const allBalances = await balancesByAccount(company);
  const cash = round2(cashIds.reduce((s, id) => s + naturalBalance('asset', allBalances.get(id)), 0));

  const openInvoices = await Invoice.find({ company, status: { $in: ['posted', 'partial'] } }).populate('contact', 'name').lean();
  const balance = (i) => round2(i.total - i.amountPaid);
  const receivables = openInvoices.filter((i) => i.kind === 'customer');
  const payables = openInvoices.filter((i) => i.kind === 'supplier');
  const overdue = receivables.filter((i) => i.dueDate && new Date(i.dueDate) < now);

  const topProducts = await Invoice.aggregate([
    { $match: { company: cid, kind: 'customer', status: { $in: ['posted', 'partial', 'paid'] }, date: { $gte: sixMonthsAgo } } },
    { $unwind: '$lines' },
    { $match: { 'lines.product': { $ne: null } } },
    { $group: { _id: '$lines.product', revenue: { $sum: '$lines.subtotal' }, quantity: { $sum: '$lines.quantity' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $project: { revenue: 1, quantity: 1, name: '$product.name', sku: '$product.sku', image: '$product.image' } },
  ]);

  const levels = await StockLevel.aggregate([{ $match: { company: cid } }, { $group: { _id: '$product', quantity: { $sum: '$quantity' } } }]);
  const qtyOf = new Map(levels.map((l) => [String(l._id), l.quantity]));
  const goods = await Product.find({ company, type: 'goods', active: true }).lean();
  const lowStock = goods
    .map((p) => ({ _id: p._id, name: p.name, sku: p.sku, quantity: qtyOf.get(String(p._id)) || 0, reorderLevel: p.reorderLevel }))
    .filter((p) => p.quantity <= p.reorderLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6);
  const stockValue = round2(goods.reduce((s, p) => s + (qtyOf.get(String(p._id)) || 0) * p.avgCost, 0));

  const pipeline = await Lead.aggregate([
    { $match: { company: cid, stage: { $nin: ['won', 'lost'] } } },
    { $group: { _id: '$stage', value: { $sum: '$value' }, count: { $sum: 1 } } },
  ]);

  const thisMonth = series[series.length - 1];
  const lastMonth = series[series.length - 2];
  const activity = await AuditLog.find({ company }).sort('-createdAt').limit(8).lean();

  return {
    cash,
    revenueThisMonth: thisMonth.income,
    revenueLastMonth: lastMonth.income,
    expensesThisMonth: thisMonth.expenses,
    profitThisMonth: thisMonth.profit,
    receivables: round2(receivables.reduce((s, i) => s + balance(i), 0)),
    payables: round2(payables.reduce((s, i) => s + balance(i), 0)),
    overdueCount: overdue.length,
    overdueAmount: round2(overdue.reduce((s, i) => s + balance(i), 0)),
    overdueInvoices: overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5).map((i) => ({ _id: i._id, number: i.number, contact: i.contact?.name, dueDate: i.dueDate, balance: balance(i) })),
    stockValue,
    series,
    topProducts,
    lowStock,
    pipeline,
    activity,
    period: { monthStart, lastMonthStart },
  };
}
