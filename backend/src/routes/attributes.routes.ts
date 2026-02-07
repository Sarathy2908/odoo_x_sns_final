import { Router } from 'express';
import { authenticate, internalAccess, adminOnly } from '../middleware/auth.middleware';
import * as controller from '../controllers/attributes.controller';

const router = Router();

router.get('/', authenticate, internalAccess, controller.getAll);
router.get('/:id', authenticate, internalAccess, controller.getOne);
router.post('/', authenticate, adminOnly, controller.create);
router.put('/:id', authenticate, adminOnly, controller.update);
router.delete('/:id', authenticate, adminOnly, controller.deleteAttribute);
router.post('/:id/values', authenticate, adminOnly, controller.addValue);
router.put('/:id/values/:valueId', authenticate, adminOnly, controller.updateValue);
router.delete('/:id/values/:valueId', authenticate, adminOnly, controller.deleteValue);

export default router;
