import mongoose from 'mongoose';
import { assetSchema, companyRef, lineSchema } from './shared.js';
import { computeTotals, round2 } from '../utils/money.js';

// Customer invoices (kind: customer) and supplier bills (kind: supplier)
const invoiceSchema = new mongoose.Schema(
  {
    company: companyRef,
    kind: { type: String, enum: ['customer', 'supplier'], required: true },
    number: { type: String, required: true },
    supplierReference: String,
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: [true, 'Choose a customer or supplier'] },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    date: { type: Date, default: Date.now },
    dueDate: Date,
    status: { type: String, enum: ['draft', 'posted', 'partial', 'paid', 'void'], default: 'draft' },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, 'Add at least one line'] },
    subtotal: Number,
    taxTotal: Number,
    total: Number,
    amountPaid: { type: Number, default: 0 },
    journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
    postedAt: Date,
    notes: String,
    attachments: [assetSchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
invoiceSchema.index({ company: 1, kind: 1, date: -1 });

invoiceSchema.virtual('balanceDue').get(function balanceDue() {
  return round2((this.total || 0) - (this.amountPaid || 0));
});

invoiceSchema.pre('validate', function totals(next) {
  if (this.status === 'draft') computeTotals(this);
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
