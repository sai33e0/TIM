import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // MySQL error handling
  if (err.name === 'ER_DUP_ENTRY') {
    const message = 'Duplicate field value entered';
    error = { name: 'DuplicateError', message, statusCode: 400 };
  }

  if (err.name === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced record not found';
    error = { name: 'ReferenceError', message, statusCode: 400 };
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = 'Invalid input data';
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { name: 'TokenError', message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { name: 'TokenError', message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};