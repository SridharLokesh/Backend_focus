// routes/siteSettingsRoutes.js
import express  from 'express';
import multer   from 'multer';
import path     from 'path';
import fs       from 'fs';
import { fileURLToPath } from 'url';
import { getSettings, updateSettings } from '../controllers/siteSettingsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router   = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ensure uploads/logos/ folder exists */
const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

/* disk storage — same approach as product image uploads */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `logo-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 2 * 1024 * 1024 },          // 2 MB
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'), false),
});

const logoFields = upload.fields([
  { name: 'logoLight',  maxCount: 1 },
  { name: 'footerLogo', maxCount: 1 },
]);

/* GET  /api/admin/site-settings  — public */
router.get('/', getSettings);

/* POST /api/admin/site-settings  — admin only */
router.post('/', protect, adminOnly, logoFields, updateSettings);

export default router;