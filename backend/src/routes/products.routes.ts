import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, addProductVariant, getProductVariants, updateProductVariant, deleteProductVariant, getAttributeLines, addAttributeLine, deleteAttributeLine } from '../controllers/products.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProducts);
router.get('/:id', authenticate, getProduct);
router.post('/', authenticate, adminOnly, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, deleteProduct);
router.post('/:id/variants', authenticate, adminOnly, addProductVariant);
router.get('/:id/variants', authenticate, getProductVariants);
router.put('/:id/variants/:variantId', authenticate, adminOnly, updateProductVariant);
router.delete('/:id/variants/:variantId', authenticate, adminOnly, deleteProductVariant);
router.get('/:id/attributes', authenticate, getAttributeLines);
router.post('/:id/attributes', authenticate, adminOnly, addAttributeLine);
router.delete('/:id/attributes/:lineId', authenticate, adminOnly, deleteAttributeLine);

export default router;
