import { Router } from 'express';
import { signup, login, requestPasswordReset, resetPassword, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/reset-password-request', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getCurrentUser);

export default router;
