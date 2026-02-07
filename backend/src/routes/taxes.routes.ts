import { Router } from 'express';
import { getTaxes, getTax, createTax, suggestTaxes, calculateTaxes, updateTax, deleteTax } from '../controllers/taxes.controller';
import { authenticate, adminOnly, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getTaxes);
router.get('/:id', authenticate, getTax);
router.post('/', authenticate, adminOnly, createTax);
router.post('/suggest', authenticate, internalAccess, suggestTaxes);
router.post('/calculate', authenticate, internalAccess, calculateTaxes);
router.put('/:id', authenticate, adminOnly, updateTax);
router.delete('/:id', authenticate, adminOnly, deleteTax);

export default router;
