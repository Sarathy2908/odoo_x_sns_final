import { Router } from 'express';
import { getQuotationTemplates, getQuotationTemplate, createQuotationTemplate, updateQuotationTemplate, deleteQuotationTemplate, addLine, updateLine, deleteLine, createSubscriptionFromTemplate } from '../controllers/quotations.controller';
import { authenticate, adminOnly, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, internalAccess, getQuotationTemplates);
router.get('/:id', authenticate, internalAccess, getQuotationTemplate);
router.post('/', authenticate, adminOnly, createQuotationTemplate);
router.put('/:id', authenticate, adminOnly, updateQuotationTemplate);
router.delete('/:id', authenticate, adminOnly, deleteQuotationTemplate);
router.post('/:id/lines', authenticate, adminOnly, addLine);
router.put('/:id/lines/:lineId', authenticate, adminOnly, updateLine);
router.delete('/:id/lines/:lineId', authenticate, adminOnly, deleteLine);
router.post('/:id/create-subscription', authenticate, internalAccess, createSubscriptionFromTemplate);

export default router;
