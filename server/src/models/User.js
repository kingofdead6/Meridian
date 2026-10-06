import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { assetSchema, companyRef } from './shared.js';
import { ROLES } from '../config/permissions.js';

const userSchema = new mongoose.Schema(
  {
    company: companyRef,
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: [8, 'Password must be at least 8 characters'], select: false },
    role: { type: String, enum: Object.keys(ROLES), default: 'sales' },
    avatar: assetSchema,
    active: { type: Boolean, default: true },
    lastLogin: Date,
    // Set once the welcome tour has been finished or skipped
    onboardedAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hash() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
