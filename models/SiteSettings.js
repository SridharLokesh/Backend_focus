// models/SiteSettings.js
import mongoose from 'mongoose';

const footerItemSchema = new mongoose.Schema({
  label: String,
  href:  String,
}, { _id: false });

const footerColumnSchema = new mongoose.Schema({
  id:          String,
  type:        { type: String, enum: ['brand', 'links', 'contact'], default: 'links' },
  title:       String,
  enabled:     { type: Boolean, default: true },
  items:       [footerItemSchema],
  phone:       String,
  phoneNote:   String,
  email:       String,
  emailNote:   String,
  address:     String,
  addressNote: String,
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
  navbar: {
    promoText:    { type: String,  default: 'Genuine TVS Parts & Accessories — Free shipping above ₹999 — 1 Year Warranty on all parts' },
    promoVisible: { type: Boolean, default: true },
    promoColor:   { type: String,  default: '#de1c0e' },
    logoLight:    { type: String,  default: '' },
  },
  footer: {
    logo:    { type: String, default: '' },
    tagline: { type: String, default: 'Official online store for genuine TVS spare parts, accessories and lubricants. Quality assured. Warranty backed.' },
    columns: { type: [footerColumnSchema], default: [] },
    socials: {
      facebook:  { type: String, default: '#' },
      twitter:   { type: String, default: '#' },
      instagram: { type: String, default: '#' },
      youtube:   { type: String, default: '#' },
    },
    bottom: {
      certified: { type: String, default: 'OEM Certified Parts' },
      secure:    { type: String, default: 'Secure Checkout' },
      warranty:  { type: String, default: '1 Year Warranty' },
    },
  },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'sitesettings' });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;