// controllers/siteSettingsController.js
const SiteSettings = require('../models/SiteSettings');
const cloudinary   = require('../config/cloudinary'); // adjust path if different
const streamifier  = require('streamifier');

/* ── helper: upload buffer to cloudinary ── */
const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/* ────────────────────────────────────────
   GET  /api/admin/site-settings
   Public — frontend reads this to render navbar/footer
──────────────────────────────────────── */
const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});   // seed defaults on first call
    res.json(settings);
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ message: 'Failed to load site settings' });
  }
};

/* ────────────────────────────────────────
   POST /api/admin/site-settings
   Admin only — multipart/form-data
   Body fields:
     section  : 'navbar' | 'footer'
     --- navbar ---
     promoText, promoVisible, promoColor
     logoLight  (file, optional)
     --- footer ---
     columns   (JSON string)
     socials   (JSON string)
     tagline
     bottom    (JSON string)
     footerLogo (file, optional)
──────────────────────────────────────── */
const updateSettings = async (req, res) => {
  try {
    const { section } = req.body;
    if (!section) return res.status(400).json({ message: 'section is required' });

    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings({});

    /* ── NAVBAR section ── */
    if (section === 'navbar') {
      const { promoText, promoVisible, promoColor } = req.body;

      if (!settings.navbar) settings.navbar = {};

      if (promoText    !== undefined) settings.navbar.promoText    = promoText;
      if (promoColor   !== undefined) settings.navbar.promoColor   = promoColor;
      if (promoVisible !== undefined)
        settings.navbar.promoVisible = promoVisible === 'true' || promoVisible === true;

      // Logo upload (navbar — light background)
      if (req.files?.logoLight?.[0]) {
        const result = await uploadToCloudinary(
          req.files.logoLight[0].buffer, 'tvs/logos'
        );
        settings.navbar.logoLight = result.secure_url;
      }
    }

    /* ── FOOTER section ── */
    else if (section === 'footer') {
      const { columns, socials, tagline, bottom } = req.body;

      if (!settings.footer) settings.footer = {};

      if (tagline)  settings.footer.tagline  = tagline;
      if (columns)  settings.footer.columns  = JSON.parse(columns);
      if (socials)  settings.footer.socials  = JSON.parse(socials);
      if (bottom)   settings.footer.bottom   = JSON.parse(bottom);

      // Footer logo upload
      if (req.files?.footerLogo?.[0]) {
        const result = await uploadToCloudinary(
          req.files.footerLogo[0].buffer, 'tvs/logos'
        );
        settings.footer.logo = result.secure_url;
      }
    }

    else {
      return res.status(400).json({ message: `Unknown section: ${section}` });
    }

    settings.updatedAt = new Date();
    settings.markModified('navbar');
    settings.markModified('footer');
    await settings.save();

    res.json({ message: 'Settings saved', settings });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ message: err.message || 'Failed to save settings' });
  }
};

module.exports = { getSettings, updateSettings };