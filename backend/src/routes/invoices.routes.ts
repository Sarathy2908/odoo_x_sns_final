import { Router } from 'express';
import { getInvoices, getInvoice, generateInvoice, confirmInvoice, cancelInvoice } from '../controllers/invoices.controller';
import { authenticate, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/generate/:subscriptionId', authenticate, internalAccess, generateInvoice);
router.put('/:id/confirm', authenticate, internalAccess, confirmInvoice);
router.put('/:id/cancel', authenticate, internalAccess, cancelInvoice);

export default router;
