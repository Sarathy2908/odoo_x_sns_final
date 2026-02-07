import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/razorpay.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/create-order', authenticate, createOrder);
router.post('/verify-payment', authenticate, verifyPayment);

export default router;
