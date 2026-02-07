import { Router } from 'express';
import { getDashboardMetrics, getSubscriptionReport, getRevenueReport, getPaymentReport } from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, getDashboardMetrics);
router.get('/subscriptions', authenticate, getSubscriptionReport);
router.get('/revenue', authenticate, getRevenueReport);
router.get('/payments', authenticate, getPaymentReport);

export default router;
