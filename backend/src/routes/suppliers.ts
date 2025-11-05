import { Router } from 'express';
import * as supplierController from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All supplier routes require authentication
router.use(authenticate);

// Public supplier routes (read access for all authenticated users)
router.get('/', asyncHandler(supplierController.getAllSuppliers));
router.get('/search', asyncHandler(supplierController.searchSuppliers));
router.get('/stats', asyncHandler(supplierController.getSupplierStats));
router.get('/:id', asyncHandler(supplierController.getSupplierById));

// Supplier modification routes (manager+ access)
router.post('/', authorize('manager', 'admin'), asyncHandler(supplierController.createSupplier));
router.put('/:id', authorize('manager', 'admin'), asyncHandler(supplierController.updateSupplier));
router.delete('/:id', authorize('admin'), asyncHandler(supplierController.deleteSupplier));

export default router;