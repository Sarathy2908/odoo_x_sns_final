import { Router } from 'express';
import { getPayments, createPayment, getPayment } from '../controllers/payments.controller';
import { authenticate, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPayments);
router.post('/', authenticate, internalAccess, createPayment);
router.get('/:id', authenticate, getPayment);

export default router;
