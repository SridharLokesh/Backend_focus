import express from 'express';
import { protect, adminOnly, dealerOnly } from '../middleware/authMiddleware.js';
import {
  submitRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  getAllDealers,
  createDealer,
  editDealer,
  resetDealerPassword,
  deleteDealer,
  toggleDealer,
  getDealerProfile,
  getDealerStats,
} from '../controllers/dealerController.js';

const router = express.Router();

// Public
router.post('/request', submitRequest);

// Admin only
router.get('/requests',               protect, adminOnly, getRequests);
router.post('/approve/:requestId',    protect, adminOnly, approveRequest);
router.put('/reject/:requestId',      protect, adminOnly, rejectRequest);
router.get('/all',                    protect, adminOnly, getAllDealers);
router.post('/create',                protect, adminOnly, createDealer);
router.put('/:id/edit',              protect, adminOnly, editDealer);
router.put('/:id/reset-password',    protect, adminOnly, resetDealerPassword);
router.delete('/:id',                protect, adminOnly, deleteDealer);
router.put('/:dealerId/toggle',      protect, adminOnly, toggleDealer);

// Dealer self-service
router.get('/profile', protect, dealerOnly, getDealerProfile);
router.get('/stats',   protect, dealerOnly, getDealerStats);

export default router;