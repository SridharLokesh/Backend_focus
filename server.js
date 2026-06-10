import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './Config/db.js';

import authRoutes         from './routes/authRoutes.js';
import productRoutes      from './routes/productRoutes.js';
import cartRoutes         from './routes/cartRoutes.js';
import wishlistRoutes     from './routes/wishlistRoutes.js';
import userRoutes         from './routes/userRoutes.js';
import orderRoutes        from './routes/orderRoutes.js';
import adminRoutes        from './routes/adminRoutes.js';
import dealerRoutes       from './routes/dealerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import categoryRoutes     from './routes/categoryRoutes.js';
import siteSettingsRoutes from './routes/siteSettingsRoutes.js';

dotenv.config();
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://e-com-automobiles.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',          authRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/cart',          cartRoutes);
app.use('/api/wishlist',      wishlistRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/dealer',        dealerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories',    categoryRoutes);
app.use('/api/admin/site-settings', siteSettingsRoutes);

app.get('/', (_req, res) => res.json({ status: 'TVS AutoParts API is running ✅' }));
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));