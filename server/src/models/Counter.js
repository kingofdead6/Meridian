import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
counterSchema.index({ company: 1, key: 1 }, { unique: true });

export default mongoose.model('Counter', counterSchema);
