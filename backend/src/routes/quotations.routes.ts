import { Router } from 'express';
import { getQuotationTemplates, createQuotationTemplate, deleteQuotationTemplate } from '../controllers/quotations.controller';
import { authenticate, adminOnly, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, internalAccess, getQuotationTemplates);
router.post('/', authenticate, adminOnly, createQuotationTemplate);
router.delete('/:id', authenticate, adminOnly, deleteQuotationTemplate);

export default router;
