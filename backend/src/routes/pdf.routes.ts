import { Router } from 'express';
import { authenticate, internalAccess } from '../middleware/auth.middleware';
import { generateInvoicePdf, generateQuotationPdf } from '../controllers/pdf.controller';

const router = Router();

router.post('/invoice/:id', authenticate, internalAccess, generateInvoicePdf);
router.post('/quotation/:id', authenticate, internalAccess, generateQuotationPdf);

export default router;
