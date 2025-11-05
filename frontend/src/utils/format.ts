import { format } from 'date-fns';

// Currency formatting
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Date formatting
export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
};

// Number formatting
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatDecimal = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Percentage formatting
export const formatPercentage = (num: number, decimals = 1): string => {
  return `${formatDecimal(num, decimals)}%`;
};

// Stock status helpers
export const getStockStatus = (quantity: number, minStockLevel: number): {
  status: 'low' | 'normal' | 'out';
  color: string;
  text: string;
} => {
  if (quantity === 0) {
    return {
      status: 'out',
      color: 'text-error-600',
      text: 'Out of Stock',
    };
  } else if (quantity <= minStockLevel) {
    return {
      status: 'low',
      color: 'text-warning-600',
      text: 'Low Stock',
    };
  } else {
    return {
      status: 'normal',
      color: 'text-success-600',
      text: 'In Stock',
    };
  }
};

// Transaction type helpers
export const getTransactionTypeInfo = (type: string): {
  color: string;
  icon: string;
  text: string;
} => {
  switch (type) {
    case 'sale':
      return {
        color: 'text-success-600',
        icon: '📈',
        text: 'Sale',
      };
    case 'purchase':
      return {
        color: 'text-primary-600',
        icon: '📦',
        text: 'Purchase',
      };
    case 'adjustment':
      return {
        color: 'text-warning-600',
        icon: '⚙️',
        text: 'Adjustment',
      };
    default:
      return {
        color: 'text-gray-600',
        icon: '📄',
        text: 'Unknown',
      };
  }
};

// User role helpers
export const getUserRoleInfo = (role: string): {
  color: string;
  text: string;
} => {
  switch (role) {
    case 'admin':
      return {
        color: 'badge-error',
        text: 'Admin',
      };
    case 'manager':
      return {
        color: 'badge-warning',
        text: 'Manager',
      };
    case 'user':
      return {
        color: 'badge-info',
        text: 'User',
      };
    default:
      return {
        color: 'badge-secondary',
        text: 'Unknown',
      };
  }
};

// Input validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateSku = (sku: string): boolean => {
  return sku.length >= 2 && /^[A-Z0-9\-_]+$/i.test(sku);
};

// Search helpers
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

// Array helpers
export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// URL helpers
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

// Debounce helper
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};