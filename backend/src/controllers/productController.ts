import { Request, Response, NextFunction } from 'express';
import { ProductModel } from '../models/Product';
import { ApiResponse, AuthRequest } from '../types';
import { createError, asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

// Validation schemas
const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  sku: Joi.string().min(2).max(50).required(),
  category: Joi.string().min(2).max(50).required(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().min(0).integer().required(),
  minStockLevel: Joi.number().min(0).integer().required(),
  supplierId: Joi.number().integer().positive().required()
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500),
  sku: Joi.string().min(2).max(50),
  category: Joi.string().min(2).max(50),
  price: Joi.number().min(0),
  quantity: Joi.number().min(0).integer(),
  minStockLevel: Joi.number().min(0).integer(),
  supplierId: Joi.number().integer().positive()
});

const stockAdjustmentSchema = Joi.object({
  quantity: Joi.number().integer().required(),
  reason: Joi.string().max(200).required()
});

// Create new product
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  // Validate input
  const { error, value } = createProductSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { sku } = value;

  // Check if SKU already exists
  const existingProduct = await ProductModel.findBySku(sku);
  if (existingProduct) {
    throw createError('Product with this SKU already exists', 400);
  }

  // Create product
  const product = await ProductModel.create(value);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

// Get all products with filters and pagination
export const getAllProducts = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const category = req.query.category as string;
  const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : undefined;
  const lowStock = req.query.lowStock === 'true';

  const { products, total } = await ProductModel.findAll(page, limit, category, supplierId, lowStock);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single product by ID
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw createError('Invalid product ID', 400);
  }

  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  res.json({
    success: true,
    data: { product }
  });
});

// Update product
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw createError('Invalid product ID', 400);
  }

  // Validate input
  const { error, value } = updateProductSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // Check if product exists
  const existingProduct = await ProductModel.findById(productId);
  if (!existingProduct) {
    throw createError('Product not found', 404);
  }

  // Check if new SKU already exists (if SKU is being updated)
  if (value.sku && value.sku !== existingProduct.sku) {
    const skuExists = await ProductModel.findBySku(value.sku);
    if (skuExists) {
      throw createError('Product with this SKU already exists', 400);
    }
  }

  // Update product
  const updatedProduct = await ProductModel.update(productId, value);
  if (!updatedProduct) {
    throw createError('Failed to update product', 500);
  }

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product: updatedProduct }
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw createError('Invalid product ID', 400);
  }

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Delete product
  const deleted = await ProductModel.delete(productId);
  if (!deleted) {
    throw createError('Failed to delete product', 500);
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Adjust product stock
export const adjustStock = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const productId = parseInt(req.params.id);

  if (isNaN(productId)) {
    throw createError('Invalid product ID', 400);
  }

  // Validate input
  const { error, value } = stockAdjustmentSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { quantity, reason } = value;

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw createError('Product not found', 404);
  }

  // Calculate new quantity
  const newQuantity = product.quantity + quantity;

  if (newQuantity < 0) {
    throw createError('Insufficient stock for this adjustment', 400);
  }

  // Update product quantity
  const updatedProduct = await ProductModel.updateQuantity(productId, quantity);
  if (!updatedProduct) {
    throw createError('Failed to adjust stock', 500);
  }

  // Create transaction record for stock adjustment
  const { TransactionModel } = await import('../models/Transaction');
  await TransactionModel.create({
    type: 'adjustment',
    productId,
    quantity,
    unitPrice: product.price,
    totalAmount: Math.abs(quantity * product.price),
    userId: req.user!.id,
    notes: reason
  });

  res.json({
    success: true,
    message: 'Stock adjusted successfully',
    data: { product: updatedProduct }
  });
});

// Get low stock products
export const getLowStockProducts = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const products = await ProductModel.getLowStockProducts();

  res.json({
    success: true,
    data: { products }
  });
});

// Get product categories
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const categories = await ProductModel.getCategories();

  res.json({
    success: true,
    data: { categories }
  });
});

// Search products
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!query || query.trim().length < 2) {
    throw createError('Search query must be at least 2 characters long', 400);
  }

  // For now, we'll use the findAll method and filter results
  // In a real implementation, you'd add a search method to ProductModel
  const { products, total } = await ProductModel.findAll(page, limit * 3); // Get more results for filtering

  // Filter products based on search query
  const searchResults = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.sku.toLowerCase().includes(query.toLowerCase()) ||
    product.category.toLowerCase().includes(query.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
  );

  // Paginate filtered results
  const startIndex = (page - 1) * limit;
  const paginatedResults = searchResults.slice(startIndex, startIndex + limit);

  res.json({
    success: true,
    data: {
      products: paginatedResults,
      pagination: {
        page,
        limit,
        total: searchResults.length,
        pages: Math.ceil(searchResults.length / limit)
      }
    }
  });
});