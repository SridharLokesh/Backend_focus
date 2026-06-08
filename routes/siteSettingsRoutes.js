// routes/siteSettingsRoutes.js
const express   = require('express');
const multer    = require('multer');
const router    = express.Router();
const { getSettings, updateSettings } = require('../controllers/siteSettingsController');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // adjust import to match your project

/* multer — memory storage (buffers go straight to Cloudinary) */
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

/* File fields accepted in a single POST */
const logoFields = upload.fields([
  { name: 'logoLight',  maxCount: 1 },
  { name: 'footerLogo', maxCount: 1 },
]);

/* ── Routes ── */

// GET  /api/admin/site-settings  — public read (navbar & footer use this)
router.get('/', getSettings);

// POST /api/admin/site-settings  — admin only write
router.post('/', protect, adminOnly, logoFields, updateSettings);

module.exports = router;