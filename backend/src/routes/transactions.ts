import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Public transaction routes (read access for all authenticated users)
router.get('/', asyncHandler(transactionController.getAllTransactions));
router.get('/stats', asyncHandler(transactionController.getTransactionStats));
router.get('/daily-stats', asyncHandler(transactionController.getDailyStats));
router.get('/:id', asyncHandler(transactionController.getTransactionById));

// Transaction creation routes (user+ access)
router.post('/', authorize('user', 'manager', 'admin'), asyncHandler(transactionController.createTransaction));
router.post('/sale', authorize('user', 'manager', 'admin'), asyncHandler(transactionController.processSale));
router.post('/purchase', authorize('manager', 'admin'), asyncHandler(transactionController.processPurchase));

export default router;