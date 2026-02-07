import { Router } from 'express';
import { getPlans, getPlan, createPlan, updatePlan, deletePlan } from '../controllers/plans.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPlans);
router.get('/:id', authenticate, getPlan);
router.post('/', authenticate, adminOnly, createPlan);
router.put('/:id', authenticate, adminOnly, updatePlan);
router.delete('/:id', authenticate, adminOnly, deletePlan);

export default router;
