export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
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
  supplier?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'manager' | 'user';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TransactionStats {
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCost: number;
  transactionCount: number;
  topProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export interface DailyStats {
  date: string;
  sales: number;
  purchases: number;
  transactions: number;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalSuppliers: number;
  totalTransactions: number;
  transactionStats: TransactionStats;
  dailyStats: DailyStats[];
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  minStockLevel: number;
  supplierId: number;
}

export interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

export interface TransactionFormData {
  type: 'sale' | 'purchase' | 'adjustment';
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  supplierInvoice?: string;
}

export interface StockAdjustmentData {
  quantity: number;
  reason: string;
}

export type SortField = 'name' | 'createdAt' | 'quantity' | 'price' | 'category';
export type FilterOptions = {
  category?: string;
  supplierId?: number;
  lowStock?: boolean;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
};