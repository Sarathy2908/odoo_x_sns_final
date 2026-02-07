import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, addProductVariant } from '../controllers/products.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProducts);
router.get('/:id', authenticate, getProduct);
router.post('/', authenticate, adminOnly, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, deleteProduct);
router.post('/:id/variants', authenticate, adminOnly, addProductVariant);

export default router;
