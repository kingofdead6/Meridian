import mongoose from 'mongoose';
import { companyRef } from './shared.js';

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

const accountSchema = new mongoose.Schema(
  {
    company: companyRef,
    code: { type: String, required: [true, 'Code is required'], trim: true },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },
    systemKey: String, // used by automatic postings, e.g. "ar", "sales"
    isCash: { type: Boolean, default: false }, // can receive / send payments
    description: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
accountSchema.index({ company: 1, code: 1 }, { unique: true });
accountSchema.index({ company: 1, systemKey: 1 }, { unique: true, partialFilterExpression: { systemKey: { $type: 'string' } } });

export default mongoose.model('Account', accountSchema);
