import { Router } from 'express';
import { getInvoices, getInvoice, generateInvoice, confirmInvoice, cancelInvoice, updateInvoice, addLine, deleteLine } from '../controllers/invoices.controller';
import { authenticate, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/generate/:subscriptionId', authenticate, internalAccess, generateInvoice);
router.put('/:id', authenticate, internalAccess, updateInvoice);
router.put('/:id/confirm', authenticate, internalAccess, confirmInvoice);
router.put('/:id/cancel', authenticate, internalAccess, cancelInvoice);
router.post('/:id/lines', authenticate, internalAccess, addLine);
router.delete('/:id/lines/:lineId', authenticate, internalAccess, deleteLine);

export default router;
