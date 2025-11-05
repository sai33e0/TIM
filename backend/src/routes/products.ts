import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Public product routes (read access for all authenticated users)
router.get('/', asyncHandler(productController.getAllProducts));
router.get('/search', asyncHandler(productController.searchProducts));
router.get('/categories', asyncHandler(productController.getCategories));
router.get('/low-stock', asyncHandler(productController.getLowStockProducts));
router.get('/:id', asyncHandler(productController.getProductById));

// Product modification routes (manager+ access)
router.post('/', authorize('manager', 'admin'), asyncHandler(productController.createProduct));
router.put('/:id', authorize('manager', 'admin'), asyncHandler(productController.updateProduct));
router.delete('/:id', authorize('manager', 'admin'), asyncHandler(productController.deleteProduct));
router.post('/:id/adjust-stock', authorize('manager', 'admin'), asyncHandler(productController.adjustStock));

// Product transactions
router.get('/:id/transactions', asyncHandler(productController.getProductTransactions));

export default router;