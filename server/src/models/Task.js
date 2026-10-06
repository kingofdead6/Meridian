import mongoose from 'mongoose';
import { companyRef } from './shared.js';

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];

const taskSchema = new mongoose.Schema(
  {
    company: companyRef,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: [true, 'Title is required'] },
    description: String,
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date,
    estimateHours: Number,
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
