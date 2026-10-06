import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const stockLevelSchema = new mongoose.Schema({
  company: companyRef,
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0 },
});
stockLevelSchema.index({ company: 1, product: 1, warehouse: 1 }, { unique: true });

export default mongoose.model('StockLevel', stockLevelSchema);
