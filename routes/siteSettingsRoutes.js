// routes/siteSettingsRoutes.js
import express               from 'express';
import multer                from 'multer';
import path                  from 'path';
import fs                    from 'fs';
import { fileURLToPath }     from 'url';
import { getSettings, updateSettings } from '../controllers/siteSettingsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router    = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── ensure upload folders exist ── */
const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
const siteDir  = path.join(__dirname, '..', 'uploads', 'site');
[logosDir, siteDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* ── disk storage — route each fieldname to its folder ── */
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const inLogos = ['logoLight', 'footerLogo'].includes(file.fieldname);
    cb(null, inLogos ? logosDir : siteDir);
  },
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 4 * 1024 * 1024 },          // 4 MB max
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/')
      ? cb(null, true)
      : cb(new Error('Only image files are allowed'), false),
});

/* Accept all 4 possible image fields in one middleware */
const uploadFields = upload.fields([
  { name: 'logoLight',   maxCount: 1 },   // navbar logo
  { name: 'footerLogo',  maxCount: 1 }, // footer logo
  { name: 'heroBgImage', maxCount: 1 },   // dealer page hero bg
  { name: 'ctaBgImage',  maxCount: 1 },   // customer care CTA bg
]);

/* GET  /api/admin/site-settings  — public (navbar, footer, pages all read this) */
router.get('/', getSettings);

/* POST /api/admin/site-settings  — admin only */
router.post('/', protect, adminOnly, uploadFields, updateSettings);

export default router;