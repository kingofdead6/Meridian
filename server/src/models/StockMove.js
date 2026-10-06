import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const stockMoveSchema = new mongoose.Schema(
  {
    company: companyRef,
    date: { type: Date, default: Date.now },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, required: true }, // positive = in, negative = out
    unitCost: { type: Number, default: 0 },
    type: { type: String, enum: ['receipt', 'delivery', 'adjustment', 'transfer_in', 'transfer_out', 'reversal'], required: true },
    reference: String,
    sourceType: String,
    sourceId: mongoose.Schema.Types.ObjectId,
    note: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
stockMoveSchema.index({ company: 1, date: -1 });

export default mongoose.model('StockMove', stockMoveSchema);
