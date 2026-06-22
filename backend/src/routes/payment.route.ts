import express from 'express';
import {
  createOrder, verifyPayment, webhookHandler,
  getMyTransactions, resumePayment, cancelPayment,
} from '../controllers/payment.controller.js';
import { checkAuth } from '../middlewares/checkAuthMiddleware.js';

const router = express.Router();

// Create order (authenticated)
router.post('/create-order', checkAuth, createOrder);

// Verify payment coming from frontend (authenticated)
router.post('/verify-payment', checkAuth, verifyPayment);

// Payment history for the current user (authenticated)
router.get('/my-transactions', checkAuth, getMyTransactions);

// Resume a still-reserved pending order (authenticated)
router.post('/:paymentId/resume', checkAuth, resumePayment);

// Cancel a still-pending order (authenticated)
router.post('/:paymentId/cancel', checkAuth, cancelPayment);

// Webhook: this route must receive raw body; we will attach express.raw middleware when mounting.
// For modularity, we just export route name — but see mounting below for express.raw.
router.post('/webhook', webhookHandler);

export default router;
