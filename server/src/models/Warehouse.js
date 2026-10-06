import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const warehouseSchema = new mongoose.Schema(
  {
    company: companyRef,
    name: { type: String, required: [true, 'Name is required'] },
    code: { type: String, required: [true, 'Code is required'], uppercase: true },
    address: String,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);
warehouseSchema.index({ company: 1, code: 1 }, { unique: true });

export default mongoose.model('Warehouse', warehouseSchema);
