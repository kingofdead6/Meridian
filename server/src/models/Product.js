import mongoose from 'mongoose';
import { assetSchema, companyRef } from './shared.js';

const productSchema = new mongoose.Schema(
  {
    company: companyRef,
    sku: { type: String, required: [true, 'SKU is required'], trim: true, uppercase: true },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    description: String,
    category: { type: String, default: 'General' },
    type: { type: String, enum: ['goods', 'service'], default: 'goods' },
    unit: { type: String, default: 'pcs' },
    salePrice: { type: Number, default: 0, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    avgCost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 20 },
    reorderLevel: { type: Number, default: 0 },
    barcode: String,
    image: assetSchema,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
productSchema.index({ company: 1, sku: 1 }, { unique: true });

productSchema.pre('save', function seedCost(next) {
  if (this.isNew && !this.avgCost) this.avgCost = this.purchasePrice;
  next();
});

export default mongoose.model('Product', productSchema);
