import mongoose from 'mongoose';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';
import ApiError from '../utils/ApiError.js';
import { nextNumber } from '../utils/numbering.js';
import { round2 } from '../utils/money.js';

const oid = (id) => new mongoose.Types.ObjectId(String(id));

export async function systemAccounts(company, session = null) {
  const accounts = await Account.find({ company, systemKey: { $type: 'string' } }).session(session);
  const map = {};
  for (const a of accounts) map[a.systemKey] = a._id;
  return new Proxy(map, {
    get(target, key) {
      if (typeof key === 'string' && !(key in target) && key !== 'then' && key !== 'toJSON') {
        throw ApiError.badRequest(`The chart of accounts is missing the system account "${key}". Restore it in Accounting.`);
      }
      return target[key];
    },
  });
}

/** Groups lines by account + side so entries stay readable, then saves a balanced entry. */
export async function postEntry({ company, date, memo, reference, source = 'manual', sourceId, lines, user }, session = null) {
  const grouped = new Map();
  for (const l of lines) {
    const debit = round2(l.debit || 0);
    const credit = round2(l.credit || 0);
    if (!debit && !credit) continue;
    const key = `${l.account}:${debit ? 'd' : 'c'}:${l.description || ''}`;
    const prev = grouped.get(key);
    if (prev) {
      prev.debit = round2(prev.debit + debit);
      prev.credit = round2(prev.credit + credit);
    } else grouped.set(key, { account: l.account, description: l.description, debit, credit });
  }
  const number = await nextNumber(company, 'journal', session);
  const entry = new JournalEntry({ company, number, date, memo, reference, source, sourceId, lines: [...grouped.values()], user });
  await entry.save({ session });
  return entry;
}

export async function reverseEntry(entryId, { user, date, memo } = {}, session = null) {
  const original = await JournalEntry.findById(entryId).session(session);
  if (!original) throw ApiError.notFound('Journal entry');
  if (original.status === 'reversed') throw ApiError.conflict('This entry has already been reversed');
  if (original.source === 'reversal') throw ApiError.conflict('A reversal entry cannot be reversed');
  const reversal = await postEntry(
    {
      company: original.company,
      date: date || new Date(),
      memo: memo || `Reversal of ${original.number}`,
      reference: original.reference,
      source: 'reversal',
      sourceId: original._id,
      lines: original.lines.map((l) => ({ account: l.account, description: l.description, debit: l.credit, credit: l.debit })),
      user,
    },
    session
  );
  reversal.reversalOf = original._id;
  await reversal.save({ session });
  original.status = 'reversed';
  original.reversedBy = reversal._id;
  await original.save({ session });
  return reversal;
}

/** Sum of debits and credits per account, optionally within a date range. */
export async function balancesByAccount(company, { from, to } = {}) {
  const match = { company: oid(company) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const rows = await JournalEntry.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    { $group: { _id: '$lines.account', debit: { $sum: '$lines.debit' }, credit: { $sum: '$lines.credit' } } },
  ]);
  const map = new Map();
  for (const r of rows) map.set(String(r._id), { debit: round2(r.debit), credit: round2(r.credit) });
  return map;
}

/** Natural balance: debit-normal for assets and expenses, credit-normal for the rest. */
export const naturalBalance = (type, { debit = 0, credit = 0 } = {}) =>
  round2(type === 'asset' || type === 'expense' ? debit - credit : credit - debit);
