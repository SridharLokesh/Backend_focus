// controllers/siteSettingsController.js
import SiteSettings from '../models/SiteSettings.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─────────────────────────────────────────
   GET /api/admin/site-settings
   Public — Navbar & Footer read this on mount
───────────────────────────────────────── */
export const getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    res.json(settings);
  } catch (err) {
    console.error('getSettings:', err);
    res.status(500).json({ message: 'Failed to load site settings' });
  }
};

/* ─────────────────────────────────────────
   POST /api/admin/site-settings
   Admin only · multipart/form-data
───────────────────────────────────────── */
export const updateSettings = async (req, res) => {
  try {
    const { section } = req.body;
    if (!section) return res.status(400).json({ message: '`section` is required' });

    let settings = await SiteSettings.findOne();
    if (!settings) settings = new SiteSettings({});

    /* ── navbar ── */
    if (section === 'navbar') {
      const { promoText, promoVisible, promoColor } = req.body;

      if (!settings.navbar) settings.navbar = {};
      if (promoText    != null) settings.navbar.promoText    = promoText;
      if (promoColor   != null) settings.navbar.promoColor   = promoColor;
      if (promoVisible != null)
        settings.navbar.promoVisible = promoVisible === 'true' || promoVisible === true;

      if (req.files?.logoLight?.[0]) {
        settings.navbar.logoLight = `/uploads/logos/${req.files.logoLight[0].filename}`;
      }
    }

    /* ── footer ── */
    else if (section === 'footer') {
      const { tagline, columns, socials, bottom } = req.body;

      if (!settings.footer) settings.footer = {};
      if (tagline) settings.footer.tagline = tagline;
      if (columns) settings.footer.columns = JSON.parse(columns);
      if (socials) settings.footer.socials = JSON.parse(socials);
      if (bottom)  settings.footer.bottom  = JSON.parse(bottom);

      if (req.files?.footerLogo?.[0]) {
        settings.footer.logo = `/uploads/logos/${req.files.footerLogo[0].filename}`;
      }
    }

    else {
      return res.status(400).json({ message: `Unknown section: "${section}"` });
    }

    settings.updatedAt = new Date();
    settings.markModified('navbar');
    settings.markModified('footer');
    await settings.save();

    res.json({ message: 'Settings saved', settings });
  } catch (err) {
    console.error('updateSettings:', err);
    res.status(500).json({ message: err.message || 'Failed to save settings' });
  }
};