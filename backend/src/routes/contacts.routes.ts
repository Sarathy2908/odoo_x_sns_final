import { Router } from 'express';
import { authenticate, internalAccess, adminOnly } from '../middleware/auth.middleware';
import { getContacts, getContact, createContact, updateContact, deleteContact, getChildren } from '../controllers/contacts.controller';

const router = Router();

router.get('/', authenticate, internalAccess, getContacts);
router.get('/:id', authenticate, internalAccess, getContact);
router.post('/', authenticate, internalAccess, createContact);
router.put('/:id', authenticate, internalAccess, updateContact);
router.delete('/:id', authenticate, adminOnly, deleteContact);
router.get('/:id/children', authenticate, internalAccess, getChildren);

export default router;
