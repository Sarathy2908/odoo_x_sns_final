import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as controller from '../controllers/portal.controller';

const router = Router();

router.get('/dashboard', authenticate, controller.getPortalDashboard);
router.get('/catalog', authenticate, controller.getCatalog);
router.get('/subscriptions', authenticate, controller.getMySubscriptions);
router.get('/subscriptions/:id', authenticate, controller.getMySubscription);
router.get('/invoices', authenticate, controller.getMyInvoices);
router.get('/invoices/:id', authenticate, controller.getMyInvoice);
router.get('/payments', authenticate, controller.getMyPayments);
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.updateProfile);
router.post('/subscribe', authenticate, controller.subscribeToPlan);

export default router;
