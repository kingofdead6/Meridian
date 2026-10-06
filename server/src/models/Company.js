import mongoose from 'mongoose';
import { assetSchema } from './shared.js';

const rateSchema = new mongoose.Schema({ name: { type: String, required: true }, rate: { type: Number, required: true } }, { _id: false });

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Company name is required'], trim: true },
    legalName: String,
    email: String,
    phone: String,
    website: String,
    address: String,
    city: String,
    country: String,
    taxId: String,
    currency: { type: String, default: 'USD' },
    logo: assetSchema,
    taxRates: { type: [rateSchema], default: [{ name: 'Standard', rate: 20 }, { name: 'Reduced', rate: 10 }, { name: 'Exempt', rate: 0 }] },
    payrollDeductions: { type: [rateSchema], default: [{ name: 'Social security', rate: 9 }, { name: 'Income tax withholding', rate: 12 }] },
    paymentTermsDays: { type: Number, default: 30 },
    invoiceNote: { type: String, default: 'Thank you for your business.' },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
