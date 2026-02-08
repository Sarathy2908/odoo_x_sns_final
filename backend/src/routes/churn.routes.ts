import { Router } from 'express';
import { handleTrainModel, handlePredictSubscription, handleBatchPredict, handleGetAtRisk } from '../controllers/churn.controller';
import { authenticate, adminOnly, internalAccess } from '../middleware/auth.middleware';

const router = Router();

// Train model — admin only
router.post('/train', authenticate, adminOnly, handleTrainModel);

// Predict for a single subscription — admin + internal users
router.get('/predict/:subscriptionId', authenticate, internalAccess, handlePredictSubscription);

// Batch predict all active subscriptions — admin only
router.post('/predict-all', authenticate, adminOnly, handleBatchPredict);

// Get at-risk subscriptions — admin + internal users
router.get('/at-risk', authenticate, internalAccess, handleGetAtRisk);

export default router;
