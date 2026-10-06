import { Router } from 'express';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { protect, signToken } from '../middleware/auth.js';
import ApiError from '../utils/ApiError.js';
import { permissionsFor } from '../config/permissions.js';
import { setupCompany } from '../services/setup.js';

const router = Router();

const session = async (user) => {
  const company = await Company.findById(user.company);
  return { token: signToken(user), user, company, permissions: permissionsFor(user.role) };
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw ApiError.badRequest('Enter your email and password');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw ApiError.unauthorized('That email and password do not match');
  if (!user.active) throw ApiError.unauthorized('This account has been deactivated');
  user.lastLogin = new Date();
  await user.save();
  res.json(await session(user));
});

// Creates a new company workspace with its owner account, chart of accounts and a warehouse
router.post('/register', async (req, res) => {
  const { companyName, name, email, password, currency } = req.body || {};
  if (!companyName || !name || !email || !password) throw ApiError.badRequest('Company name, your name, email and password are required');
  if (await User.exists({ email: String(email).toLowerCase() })) throw ApiError.conflict('An account with this email already exists');
  const company = await Company.create({ name: companyName, currency: currency || 'USD', email });
  await setupCompany(company._id);
  const user = await User.create({ company: company._id, name, email, password, role: 'admin' });
  res.status(201).json(await session(user));
});

router.get('/me', protect, async (req, res) => res.json(await session(req.user)));

router.put('/me', protect, async (req, res) => {
  const { name, avatar } = req.body || {};
  if (name) req.user.name = name;
  if (avatar !== undefined) req.user.avatar = avatar;
  await req.user.save();
  res.json(req.user);
});

// Marks the welcome tour as seen (finished or skipped) so it does not open again
router.post('/onboarded', protect, async (req, res) => {
  req.user.onboardedAt = req.user.onboardedAt || new Date();
  await req.user.save();
  res.json(req.user);
});

router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw ApiError.badRequest('Your current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ ok: true });
});

export default router;
