/**
 * seedCategories.js  —  TVS Parts & Accessories
 * Run: node seedCategories.js
 * Safe to re-run — existing slugs are skipped.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const subCategorySchema = new mongoose.Schema({
  name:     { type: String, required: true },
  slug:     { type: String, required: true },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});
const categorySchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, unique: true },
    slug:          { type: String, required: true, unique: true },
    icon:          { type: String, default: '' },
    description:   { type: String, default: '' },
    navOrder:      { type: Number, default: 0 },
    showInNav:     { type: Boolean, default: true },
    showInFooter:  { type: Boolean, default: true },
    isActive:      { type: Boolean, default: true },
    subCategories: [subCategorySchema],
  },
  { timestamps: true }
);
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// ── Slug: strip special chars FIRST, then replace spaces with dash ───
// Prevents double-dashes from "Tyres & Wheels" → "tyres-wheels" (not "tyres--wheels")
const slug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove & and other special chars
    .replace(/\s+/g, '-')            // spaces → single dash
    .replace(/-+/g, '-');            // collapse any double dashes

// ── Categories — slugs are explicit so there's no ambiguity ──────────
const categories = [
  {
    name: 'Engine Parts',
    slug: 'engine-parts',
    navOrder: 1,
    subCategories: [
      'Pistons & Rings',
      'Cylinder Head',
      'Camshaft & Valves',
      'Crankshaft & Bearings',
      'Engine Gaskets & Seals',
      'Oil Pump',
      'Timing Chain & Sprockets',
      'Engine Mounts',
      'Carburettor & Fuel Injector',
      'Air Filter',
    ],
  },
  {
    name: 'Brakes',
    slug: 'brakes',
    navOrder: 2,
    subCategories: [
      'Disc Brake Pads',
      'Drum Brake Shoes',
      'Brake Disc Rotor',
      'Brake Drum',
      'Brake Caliper',
      'Brake Cable & Lever',
      'Master Cylinder',
      'Brake Fluid',
      'ABS Sensors',
    ],
  },
  {
    name: 'Electricals',
    slug: 'electricals',
    navOrder: 3,
    subCategories: [
      'Headlight & Bulbs',
      'Tail Light & Indicators',
      'Battery',
      'Spark Plugs',
      'CDI / ECU Unit',
      'Wiring Harness',
      'Horn',
      'Speedometer & Cluster',
      'Switches & Relays',
      'Voltage Regulator / Rectifier',
      'Starter Motor',
      'Alternator / Magneto',
    ],
  },
  {
    name: 'Body Parts',
    slug: 'body-parts',
    navOrder: 4,
    subCategories: [
      'Front Fairing & Cowl',
      'Side Panels',
      'Fuel Tank',
      'Seat & Seat Cover',
      'Mudguard / Fender',
      'Belly Pan',
      'Rear Cowl',
      'Frame & Sub-frame',
      'Centre Stand & Side Stand',
      'Footrest & Pegs',
      'Crash Guard / Engine Guard',
    ],
  },
  {
    name: 'Tyres & Wheels',
    slug: 'tyres-wheels',
    navOrder: 5,
    subCategories: [
      'Tyres',
      'Tubes',
      'Alloy Wheels',
      'Spoke Wheels',
      'Wheel Bearings',
      'Rim Tape',
      'Tyre Valve',
    ],
  },
  {
    name: 'Lubricants',
    slug: 'lubricants',
    navOrder: 6,
    subCategories: [
      'Engine Oil',
      'Gear Oil',
      'Fork Oil',
      'Chain Lubricant',
      'Brake Fluid',
      'Coolant',
      'Grease & Anti-seize',
    ],
  },
  {
    name: 'Suspension',
    slug: 'suspension',
    navOrder: 7,
    subCategories: [
      'Front Fork Assembly',
      'Fork Oil & Seals',
      'Rear Shock Absorber',
      'Swing Arm',
      'Handlebar & Grips',
      'Steering Head Bearings',
      'Yoke & Clamps',
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    navOrder: 8,
    subCategories: [
      'Windshield & Visor',
      'Tank Pad & Protectors',
      'Handlebar Accessories',
      'Mirrors',
      'Luggage & Saddlebags',
      'Phone & GPS Mount',
      'Stickers & Decals',
      'Bike Cover',
      'LED Lights & DRL',
    ],
  },
];

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!MONGO_URI) { console.error('❌  MONGO_URI not in .env'); process.exit(1); }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected\n');

  let inserted = 0, skipped = 0;

  for (const cat of categories) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (exists) {
      console.log(`⏭️   Skip: ${cat.name} (${cat.slug})`);
      skipped++; continue;
    }
    await Category.create({
      name:         cat.name,
      slug:         cat.slug,           // explicit slug — no auto-generation risk
      icon:         '',
      description:  '',
      navOrder:     cat.navOrder,
      showInNav:    true,
      showInFooter: true,
      isActive:     true,
      subCategories: cat.subCategories.map((sub, i) => ({
        name:     sub,
        slug:     slug(sub),
        order:    i,
        isActive: true,
      })),
    });
    console.log(`✅  Inserted: ${cat.name} → /${cat.slug}  (${cat.subCategories.length} subs)`);
    inserted++;
  }

  console.log(`\n🎉  Done — ${inserted} inserted, ${skipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });