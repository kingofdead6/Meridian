import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const contactSchema = new mongoose.Schema(
  {
    company: companyRef,
    type: { type: String, enum: ['customer', 'supplier', 'both'], default: 'customer' },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    contactPerson: String,
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    taxId: String,
    address: String,
    city: String,
    country: String,
    paymentTermsDays: Number,
    notes: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
contactSchema.index({ company: 1, name: 1 });

export default mongoose.model('Contact', contactSchema);
