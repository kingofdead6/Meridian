import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { can } from '../config/permissions.js';

export async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Sign in again.');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw ApiError.unauthorized('This account is no longer active');
  req.user = user;
  next();
}

export const authorize = (modules) => (req, res, next) => {
  if (!can(req.user.role, modules)) throw ApiError.forbidden();
  next();
};

export const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
