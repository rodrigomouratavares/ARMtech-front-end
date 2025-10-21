/**
 * Common type definitions used across the application
 */

/**
 * Standard API response format for successful requests
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API response format for error requests
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path?: string;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  timestamp: string;
}

/**
 * User roles enum
 */
export type UserRole = 'admin' | 'manager' | 'employee';

/**
 * Pre-sale status enum
 */
export type PreSaleStatus = 'draft' | 'pending' | 'approved' | 'cancelled' | 'converted';

/**
 * Common filter parameters for list endpoints
 */
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Database entity base interface
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}