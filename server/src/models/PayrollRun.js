import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const payLineSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  name: String,
  position: String,
  gross: Number,
  deductions: [{ _id: false, name: String, amount: Number }],
  totalDeductions: Number,
  net: Number,
});

const payrollSchema = new mongoose.Schema(
  {
    company: companyRef,
    number: { type: String, required: true },
    period: { type: String, required: true, match: [/^\d{4}-\d{2}$/, 'Period must look like 2026-01'] },
    date: { type: Date, default: Date.now },
    lines: [payLineSchema],
    totalGross: Number,
    totalDeductions: Number,
    totalNet: Number,
    status: { type: String, enum: ['draft', 'posted'], default: 'draft' },
    paidFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
payrollSchema.index({ company: 1, period: 1 }, { unique: true });

export default mongoose.model('PayrollRun', payrollSchema);
