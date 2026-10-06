import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const departmentSchema = new mongoose.Schema(
  {
    company: companyRef,
    name: { type: String, required: [true, 'Name is required'] },
    description: String,
    color: { type: String, default: '#2E6B4E' },
  },
  { timestamps: true }
);

export default mongoose.model('Department', departmentSchema);
