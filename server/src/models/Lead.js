import mongoose from 'mongoose';
import { companyRef } from './shared.js';

export const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const leadSchema = new mongoose.Schema(
  {
    company: companyRef,
    title: { type: String, required: [true, 'Title is required'], trim: true },
    contactName: String,
    organization: String,
    email: String,
    phone: String,
    value: { type: Number, default: 0 },
    stage: { type: String, enum: STAGES, default: 'new' },
    source: { type: String, default: 'Website' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expectedClose: Date,
    notes: String,
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Lead', leadSchema);
