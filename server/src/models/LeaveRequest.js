import mongoose from 'mongoose';
import { companyRef } from './shared.js';

const leaveSchema = new mongoose.Schema(
  {
    company: companyRef,
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: [true, 'Choose an employee'] },
    type: { type: String, enum: ['annual', 'sick', 'unpaid', 'other'], default: 'annual' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: Number,
    reason: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

leaveSchema.pre('validate', function countDays(next) {
  if (this.startDate && this.endDate) {
    if (this.endDate < this.startDate) return next(new Error('End date must be on or after the start date'));
    let days = 0;
    const d = new Date(this.startDate);
    while (d <= this.endDate) {
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) days += 1;
      d.setDate(d.getDate() + 1);
    }
    this.days = days;
  }
  next();
});

export default mongoose.model('LeaveRequest', leaveSchema);
