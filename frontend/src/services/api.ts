import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic GET request
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Request failed');
  }

  // Generic DELETE request
  async delete(url: string): Promise<void> {
    const response = await this.client.delete<ApiResponse>(url);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed');
    }
  }

  // Pagination helper
  async getPaginated<T>(url: string, params?: PaginationParams): Promise<PaginatedResponse<T>> {
    const response = await this.get<{ items: T[]; total: number }>(url, params);
    return {
      data: response.items,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: response.total,
        pages: Math.ceil(response.total / (params?.limit || 10)),
      },
    };
  }
}

export const apiService = new ApiService();

// Export specific service methods for better organization
export const authApi = {
  login: async (email: string, password: string) => {
    return apiService.post('/auth/login', { email, password });
  },
  register: async (userData: any) => {
    return apiService.post('/auth/register', userData);
  },
  getProfile: async () => {
    return apiService.get('/auth/profile');
  },
  updateProfile: async (userData: any) => {
    return apiService.put('/auth/profile', userData);
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiService.put('/auth/change-password', { currentPassword, newPassword });
  },
};

export const productsApi = {
  getAll: async (params?: any) => {
    return apiService.getPaginated('/products', params);
  },
  getById: async (id: number) => {
    return apiService.get(`/products/${id}`);
  },
  create: async (productData: any) => {
    return apiService.post('/products', productData);
  },
  update: async (id: number, productData: any) => {
    return apiService.put(`/products/${id}`, productData);
  },
  delete: async (id: number) => {
    return apiService.delete(`/products/${id}`);
  },
  adjustStock: async (id: number, adjustmentData: any) => {
    return apiService.post(`/products/${id}/adjust-stock`, adjustmentData);
  },
  getLowStock: async () => {
    return apiService.get('/products/low-stock');
  },
  getCategories: async () => {
    return apiService.get('/products/categories');
  },
  search: async (query: string, params?: PaginationParams) => {
    return apiService.getPaginated('/products/search', { q: query, ...params });
  },
  getTransactions: async (id: number, params?: PaginationParams) => {
    return apiService.getPaginated(`/products/${id}/transactions`, params);
  },
};

export const suppliersApi = {
  getAll: async (params?: any) => {
    return apiService.getPaginated('/suppliers', params);
  },
  getById: async (id: number) => {
    return apiService.get(`/suppliers/${id}`);
  },
  create: async (supplierData: any) => {
    return apiService.post('/suppliers', supplierData);
  },
  update: async (id: number, supplierData: any) => {
    return apiService.put(`/suppliers/${id}`, supplierData);
  },
  delete: async (id: number) => {
    return apiService.delete(`/suppliers/${id}`);
  },
  getStats: async () => {
    return apiService.get('/suppliers/stats');
  },
  search: async (query: string, params?: PaginationParams) => {
    return apiService.getPaginated('/suppliers/search', { q: query, ...params });
  },
};

export const transactionsApi = {
  getAll: async (params?: any) => {
    return apiService.getPaginated('/transactions', params);
  },
  getById: async (id: number) => {
    return apiService.get(`/transactions/${id}`);
  },
  create: async (transactionData: any) => {
    return apiService.post('/transactions', transactionData);
  },
  processSale: async (saleData: any) => {
    return apiService.post('/transactions/sale', saleData);
  },
  processPurchase: async (purchaseData: any) => {
    return apiService.post('/transactions/purchase', purchaseData);
  },
  getStats: async (params?: any) => {
    return apiService.get('/transactions/stats', params);
  },
  getDailyStats: async (days?: number) => {
    return apiService.get('/transactions/daily-stats', { days });
  },
};

export default apiService;