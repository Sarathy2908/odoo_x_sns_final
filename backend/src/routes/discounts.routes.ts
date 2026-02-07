import { Router } from 'express';
import { getDiscounts, getDiscount, createDiscount, updateDiscount, deleteDiscount } from '../controllers/discounts.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getDiscounts);
router.get('/:id', authenticate, getDiscount);
router.post('/', authenticate, adminOnly, createDiscount);
router.put('/:id', authenticate, adminOnly, updateDiscount);
router.delete('/:id', authenticate, adminOnly, deleteDiscount);

export default router;
