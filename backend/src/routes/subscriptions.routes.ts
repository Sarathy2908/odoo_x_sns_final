import { Router } from 'express';
import { getSubscriptions, getSubscription, createSubscription, updateSubscriptionStatus, addSubscriptionLine, updateSubscription, deleteSubscription, deleteSubscriptionLine, renewSubscription, upsellSubscription, getSubscriptionHistory } from '../controllers/subscriptions.controller';
import { authenticate, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getSubscriptions);
router.get('/:id', authenticate, getSubscription);
router.post('/', authenticate, createSubscription);
router.put('/:id/status', authenticate, internalAccess, updateSubscriptionStatus);
router.post('/:id/lines', authenticate, addSubscriptionLine);
router.put('/:id', authenticate, updateSubscription);
router.delete('/:id', authenticate, deleteSubscription);
router.delete('/:id/lines/:lineId', authenticate, deleteSubscriptionLine);

// Renewal/Upsell/History
router.post('/:id/renew', authenticate, internalAccess, renewSubscription);
router.post('/:id/upsell', authenticate, internalAccess, upsellSubscription);
router.get('/:id/history', authenticate, getSubscriptionHistory);

export default router;
