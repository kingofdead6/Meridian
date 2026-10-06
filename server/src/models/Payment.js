import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const paymentSchema = new mongoose.Schema(
  {
    company: companyRef,
    number: { type: String, required: true },
    kind: { type: String, enum: ['in', 'out'], required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be above zero'] },
    method: { type: String, enum: ['cash', 'bank_transfer', 'card', 'check', 'other'], default: 'bank_transfer' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    reference: String,
    notes: String,
    journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
paymentSchema.index({ company: 1, date: -1 });

export default mongoose.model('Payment', paymentSchema);
