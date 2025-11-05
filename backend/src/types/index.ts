export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  minStockLevel: number;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  type: 'sale' | 'purchase' | 'adjustment';
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  userId: number;
  notes?: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}