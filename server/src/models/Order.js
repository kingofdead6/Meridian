import mongoose from 'mongoose';
import { companyRef, lineSchema } from './shared.js';
import { computeTotals } from '../utils/money.js';

// One model for sales orders (kind: sale) and purchase orders (kind: purchase)
const orderSchema = new mongoose.Schema(
  {
    company: companyRef,
    kind: { type: String, enum: ['sale', 'purchase'], required: true },
    number: { type: String, required: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: [true, 'Choose a customer or supplier'] },
    date: { type: Date, default: Date.now },
    expectedDate: Date,
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    status: { type: String, enum: ['draft', 'confirmed', 'fulfilled', 'invoiced', 'cancelled'], default: 'draft' },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, 'Add at least one line'] },
    subtotal: Number,
    taxTotal: Number,
    total: Number,
    notes: String,
    fulfilledAt: Date,
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
orderSchema.index({ company: 1, kind: 1, date: -1 });

orderSchema.pre('validate', function totals(next) {
  computeTotals(this);
  next();
});

export default mongoose.model('Order', orderSchema);
