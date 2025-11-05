import { Request, Response, NextFunction } from 'express';
import { SupplierModel } from '../models/Supplier';
import { ApiResponse, AuthRequest } from '../types';
import { createError, asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

// Validation schemas
const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).required(),
  address: Joi.string().min(5).max(200).required(),
  contactPerson: Joi.string().min(2).max(100).required()
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phone: Joi.string().min(10).max(20),
  address: Joi.string().min(5).max(200),
  contactPerson: Joi.string().min(2).max(100)
});

// Create new supplier
export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  // Validate input
  const { error, value } = createSupplierSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { name } = value;

  // Check if supplier name already exists
  const existingSupplier = await SupplierModel.findByName(name);
  if (existingSupplier) {
    throw createError('Supplier with this name already exists', 400);
  }

  // Create supplier
  const supplier = await SupplierModel.create(value);

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: { supplier }
  });
});

// Get all suppliers with filters and pagination
export const getAllSuppliers = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;

  const { suppliers, total } = await SupplierModel.findAll(page, limit, search);

  res.json({
    success: true,
    data: {
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single supplier by ID
export const getSupplierById = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const supplierId = parseInt(req.params.id);

  if (isNaN(supplierId)) {
    throw createError('Invalid supplier ID', 400);
  }

  const supplier = await SupplierModel.findById(supplierId);
  if (!supplier) {
    throw createError('Supplier not found', 404);
  }

  res.json({
    success: true,
    data: { supplier }
  });
});

// Update supplier
export const updateSupplier = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const supplierId = parseInt(req.params.id);

  if (isNaN(supplierId)) {
    throw createError('Invalid supplier ID', 400);
  }

  // Validate input
  const { error, value } = updateSupplierSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // Check if supplier exists
  const existingSupplier = await SupplierModel.findById(supplierId);
  if (!existingSupplier) {
    throw createError('Supplier not found', 404);
  }

  // Check if new name already exists (if name is being updated)
  if (value.name && value.name !== existingSupplier.name) {
    const nameExists = await SupplierModel.findByName(value.name);
    if (nameExists) {
      throw createError('Supplier with this name already exists', 400);
    }
  }

  // Update supplier
  const updatedSupplier = await SupplierModel.update(supplierId, value);
  if (!updatedSupplier) {
    throw createError('Failed to update supplier', 500);
  }

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: { supplier: updatedSupplier }
  });
});

// Delete supplier
export const deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const supplierId = parseInt(req.params.id);

  if (isNaN(supplierId)) {
    throw createError('Invalid supplier ID', 400);
  }

  // Check if supplier exists
  const supplier = await SupplierModel.findById(supplierId);
  if (!supplier) {
    throw createError('Supplier not found', 404);
  }

  // Delete supplier (will throw error if supplier has products)
  try {
    const deleted = await SupplierModel.delete(supplierId);
    if (!deleted) {
      throw createError('Failed to delete supplier', 500);
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Cannot delete supplier with associated products') {
      throw createError('Cannot delete supplier with associated products. Please reassign or delete the products first.', 400);
    }
    throw error;
  }
});

// Get supplier statistics
export const getSupplierStats = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const stats = await SupplierModel.getSupplierStats();

  res.json({
    success: true,
    data: { stats }
  });
});

// Search suppliers
export const searchSuppliers = asyncHandler(async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  const query = req.query.q as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!query || query.trim().length < 2) {
    throw createError('Search query must be at least 2 characters long', 400);
  }

  const { suppliers, total } = await SupplierModel.findAll(page, limit, query);

  res.json({
    success: true,
    data: {
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});