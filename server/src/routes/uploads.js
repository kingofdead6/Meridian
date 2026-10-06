import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { cloudinaryReady, destroyAsset, uploadBuffer } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const router = Router();

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose a file to upload');
  if (!cloudinaryReady()) throw new ApiError(503, 'File uploads need Cloudinary credentials in the server .env file');
  const folder = `meridian/${req.user.company}/${(req.body.folder || 'files').replace(/[^a-z0-9-_]/gi, '')}`;
  const result = await uploadBuffer(req.file.buffer, { folder });
  res.status(201).json({ url: result.secure_url, publicId: result.public_id, name: req.file.originalname, type: req.file.mimetype });
});

router.delete('/', async (req, res) => {
  const { publicId } = req.body || {};
  if (!publicId || !publicId.startsWith(`meridian/${req.user.company}/`)) throw ApiError.badRequest('Unknown file');
  await destroyAsset(publicId);
  res.json({ ok: true });
});

export default router;
