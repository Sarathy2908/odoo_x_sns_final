import { Router } from 'express';
import { getUsers, getUser, createInternalUser, updateUser, deleteUser, changeUserRole } from '../controllers/users.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUser);
router.post('/internal', authenticate, adminOnly, createInternalUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, adminOnly, deleteUser);
router.put('/:id/role', authenticate, adminOnly, changeUserRole);

export default router;
