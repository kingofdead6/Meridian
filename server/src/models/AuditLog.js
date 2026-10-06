import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const auditSchema = new mongoose.Schema(
  {
    company: companyRef,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    action: String,
    entity: String,
    entityId: mongoose.Schema.Types.ObjectId,
    summary: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditSchema.index({ company: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditSchema);
