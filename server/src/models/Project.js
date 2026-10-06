import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const projectSchema = new mongoose.Schema(
  {
    company: companyRef,
    name: { type: String, required: [true, 'Name is required'] },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    description: String,
    status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed'], default: 'planning' },
    startDate: Date,
    dueDate: Date,
    budget: { type: Number, default: 0 },
    color: { type: String, default: '#2E6B4E' },
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
