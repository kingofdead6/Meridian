import mongoose from 'mongoose';
import { assetSchema, companyRef } from './shared.js';

const employeeSchema = new mongoose.Schema(
  {
    company: companyRef,
    employeeNo: String,
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: String,
    phone: String,
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    position: String,
    hireDate: Date,
    salary: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'on_leave', 'terminated'], default: 'active' },
    leaveBalance: { type: Number, default: 21 },
    address: String,
    avatar: assetSchema,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

employeeSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Employee', employeeSchema);
