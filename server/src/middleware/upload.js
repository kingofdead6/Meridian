import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    allowed.includes(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Upload a PNG, JPG, WebP, GIF or PDF file')),
});
