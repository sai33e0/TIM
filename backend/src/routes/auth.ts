import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Protected routes (require authentication)
router.get('/profile', authenticate, asyncHandler(authController.getProfile));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));

// Admin only routes
router.get('/users', authenticate, authorize('admin'), asyncHandler(authController.getAllUsers));

export default router;