import { Request, Response, NextFunction } from 'express';
import { TransactionModel } from '../models/Transaction';
import { ProductModel } from '../models/Product';
import { ApiResponse, AuthRequest } from '../types';
import { createError, asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

// Validation schemas
const createTransactionSchema = Joi.object({
  type: Joi.string().valid('sale', 'purchase', 'adjustment').required(),
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().required(),
  unitPrice: Joi.number().min(0).required(),
  notes: Joi.string().max(500).optional()
});

const updateTransactionSchema = Joi.object({
  type: Joi.string().valid('sale', 'purchase', 'adjustment'),
  quantity: Joi.number().integer(),
  unitPrice: Joi.number().min(0),
  notes: Joi.string().max(500)
});

// Create new transaction
export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  // Validate input
  const { error, value } = createTransactionSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { type, productId, quantity, unitPrice, notes } = value;

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Validate stock availability for sales
  if (type === 'sale' && product.quantity < Math.abs(quantity)) {
    throw createError('Insufficient stock for this sale', 400);
  }

  // Calculate total amount
  const totalAmount = Math.abs(quantity) * unitPrice;

  // Create transaction
  const transaction = await TransactionModel.create({
    type,
    productId,
    quantity,
    unitPrice,
    totalAmount,
    userId: req.user!.id,
    notes
  });

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: { transaction }
  });
});

// Get all transactions with filters and pagination
export const getAllTransactions = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { transactions, total } = await TransactionModel.findAll(
    page, limit, type, productId, userId, startDate, endDate
  );

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single transaction by ID
export const getTransactionById = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const transactionId = parseInt(req.params.id);

  if (isNaN(transactionId)) {
    throw createError('Invalid transaction ID', 400);
  }

  const transaction = await TransactionModel.findById(transactionId);
  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  res.json({
    success: true,
    data: { transaction }
  });
});

// Get transaction statistics
export const getTransactionStats = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const stats = await TransactionModel.getTransactionStats(startDate, endDate);

  res.json({
    success: true,
    data: { stats }
  });
});

// Get daily transaction statistics
export const getDailyStats = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const days = parseInt(req.query.days as string) || 30;

  if (days < 1 || days > 365) {
    throw createError('Days parameter must be between 1 and 365', 400);
  }

  const stats = await TransactionModel.getDailyStats(days);

  res.json({
    success: true,
    data: { stats }
  });
});

// Process sale transaction
export const processSale = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  // Validate input for sale
  const saleSchema = Joi.object({
    productId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    unitPrice: Joi.number().min(0).required(),
    customerName: Joi.string().max(100).optional(),
    customerEmail: Joi.string().email().optional(),
    notes: Joi.string().max(500).optional()
  });

  const { error, value } = saleSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { productId, quantity, unitPrice, customerName, customerEmail, notes } = value;

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Validate stock availability
  if (product.quantity < quantity) {
    throw createError('Insufficient stock for this sale', 400);
  }

  // Calculate total amount
  const totalAmount = quantity * unitPrice;

  // Create sale transaction
  const transaction = await TransactionModel.create({
    type: 'sale',
    productId,
    quantity: -quantity, // Negative for sales
    unitPrice,
    totalAmount,
    userId: req.user!.id,
    notes: notes ? `${notes}\nCustomer: ${customerName || 'N/A'}${customerEmail ? ` (${customerEmail})` : ''}` :
           `Customer: ${customerName || 'N/A'}${customerEmail ? ` (${customerEmail})` : ''}`
  });

  res.status(201).json({
    success: true,
    message: 'Sale processed successfully',
    data: { transaction }
  });
});

// Process purchase transaction
export const processPurchase = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  // Validate input for purchase
  const purchaseSchema = Joi.object({
    productId: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    unitPrice: Joi.number().min(0).required(),
    supplierInvoice: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  });

  const { error, value } = purchaseSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { productId, quantity, unitPrice, supplierInvoice, notes } = value;

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Calculate total amount
  const totalAmount = quantity * unitPrice;

  // Create purchase transaction
  const transaction = await TransactionModel.create({
    type: 'purchase',
    productId,
    quantity,
    unitPrice,
    totalAmount,
    userId: req.user!.id,
    notes: notes ? `${notes}${supplierInvoice ? `\nInvoice: ${supplierInvoice}` : ''}` :
           (supplierInvoice ? `Invoice: ${supplierInvoice}` : '')
  });

  res.status(201).json({
    success: true,
    message: 'Purchase processed successfully',
    data: { transaction }
  });
});

// Get transactions for a specific product
export const getProductTransactions = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const productId = parseInt(req.params.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (isNaN(productId)) {
    throw createError('Invalid product ID', 400);
  }

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const { transactions, total } = await TransactionModel.findAll(page, limit, undefined, productId);

  res.json({
    success: true,
    data: {
      product,
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});