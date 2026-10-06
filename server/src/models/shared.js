import mongoose from 'mongoose';

const { Schema } = mongoose;

export const assetSchema = new Schema(
  { url: String, publicId: String, name: String, type: String },
  { _id: false }
);

export const lineSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  description: { type: String, trim: true },
  quantity: { type: Number, required: true, min: [0.0001, 'Quantity must be above zero'] },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  taxRate: { type: Number, default: 0, min: 0 },
  account: { type: Schema.Types.ObjectId, ref: 'Account' }, // optional override for bills (e.g. rent expense)
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
});

export const companyRef = { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true };
