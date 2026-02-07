import { Router } from 'express';
import { getSubscriptions, getSubscription, createSubscription, updateSubscriptionStatus, addSubscriptionLine } from '../controllers/subscriptions.controller';
import { authenticate, internalAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getSubscriptions);
router.get('/:id', authenticate, getSubscription);
router.post('/', authenticate, internalAccess, createSubscription);
router.put('/:id/status', authenticate, internalAccess, updateSubscriptionStatus);
router.post('/:id/lines', authenticate, internalAccess, addSubscriptionLine);

export default router;
