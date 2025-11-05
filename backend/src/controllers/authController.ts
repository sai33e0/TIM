import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { ApiResponse, AuthRequest } from '../types';
import { createError, asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'manager', 'user').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  role: Joi.string().valid('admin', 'manager', 'user')
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Generate JWT token
const generateToken = (userId: number, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw createError('JWT secret not configured', 500);
  }

  return jwt.sign({ id: userId, email, role }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });
};

// Register new user
export const register = asyncHandler(async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  // Validate input
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email, password, firstName, lastName, role } = value;

  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    throw createError('User with this email already exists', 400);
  }

  // Create user
  const user = await UserModel.create({
    email,
    password,
    firstName,
    lastName,
    role
  });

  // Generate token
  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response<ApiResponse>): Promise<void> => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Find user by email
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await UserModel.verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken(user.id, user.email, user.role);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    }
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  const user = await UserModel.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  // Validate input
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const updatedUser = await UserModel.update(req.user.id, value);
  if (!updatedUser) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role
      }
    }
  });
});

// Change password
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  if (!req.user) {
    throw createError('User not authenticated', 401);
  }

  // Validate input
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { currentPassword, newPassword } = value;

  // Get user with password
  const user = await UserModel.findByEmail(req.user.email);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  // Update password
  await UserModel.updatePassword(user.id, newPassword);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Get all users (admin only)
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const { users, total } = await UserModel.findAll(page, limit);

  res.json({
    success: true,
    data: {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});