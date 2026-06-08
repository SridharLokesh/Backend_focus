// routes/siteSettingsRoutes.js
import express  from 'express';
import multer   from 'multer';
import { getSettings, updateSettings } from '../controllers/siteSettingsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js'; // ← same middleware your other routes use

const router  = express.Router();

/* multer: keep files in memory → stream to Cloudinary */
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },           // 2 MB
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'), false),
});

const logoFields = upload.fields([
  { name: 'logoLight',  maxCount: 1 },
  { name: 'footerLogo', maxCount: 1 },
]);

/* GET  /api/admin/site-settings  — public, no auth */
router.get('/', getSettings);

/* POST /api/admin/site-settings  — admin only */
router.post('/', protect, adminOnly, logoFields, updateSettings);

export default router;