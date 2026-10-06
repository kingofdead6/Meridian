import mongoose from 'mongoose';
import { companyRef } from './shared.js';
import { round2 } from '../utils/money.js';

const entryLineSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  description: String,
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
});

const journalEntrySchema = new mongoose.Schema(
  {
    company: companyRef,
    number: { type: String, required: true },
    date: { type: Date, default: Date.now },
    memo: String,
    reference: String,
    source: { type: String, enum: ['manual', 'invoice', 'bill', 'payment', 'stock', 'payroll', 'reversal', 'opening'], default: 'manual' },
    sourceId: mongoose.Schema.Types.ObjectId,
    lines: { type: [entryLineSchema], validate: [(v) => v.length >= 2, 'An entry needs at least two lines'] },
    totalDebit: Number,
    totalCredit: Number,
    status: { type: String, enum: ['posted', 'reversed'], default: 'posted' },
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
journalEntrySchema.index({ company: 1, date: -1 });
journalEntrySchema.index({ company: 1, 'lines.account': 1 });

journalEntrySchema.pre('validate', function balance(next) {
  this.lines = this.lines.filter((l) => l.debit > 0 || l.credit > 0);
  this.totalDebit = round2(this.lines.reduce((s, l) => s + (l.debit || 0), 0));
  this.totalCredit = round2(this.lines.reduce((s, l) => s + (l.credit || 0), 0));
  if (this.totalDebit !== this.totalCredit) {
    return next(new Error(`Entry is out of balance: debits ${this.totalDebit} vs credits ${this.totalCredit}`));
  }
  if (this.totalDebit === 0) return next(new Error('Entry total must be above zero'));
  next();
});

export default mongoose.model('JournalEntry', journalEntrySchema);
