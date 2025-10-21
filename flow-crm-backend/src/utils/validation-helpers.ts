import { ZodSchema, ZodError } from 'zod';
import { FastifyRequest } from 'fastify';
import { ValidationError } from '../types/error.types';

/**
 * Validation helper functions for common validation patterns
 */

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: ValidationErrorDetail[];
  };
}

/**
 * Validation error detail interface
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  received?: any;
  expected?: any;
}

/**
 * Validate request data with detailed error handling
 */
export const validateRequestData = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string = 'data'
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      message: `${context} validation failed`,
      details: formatZodErrorDetails(result.error),
    },
  };
};

/**
 * Validate and throw on error (for use in services)
 */
export const validateOrThrow = <T>(
  schema: ZodSchema<T>,
  data: unknown,
  context: string = 'data'
): T => {
  const result = validateRequestData(schema, data, context);
  
  if (!result.success) {
    throw new ValidationError(result.error!.message, {
      errors: result.error!.details,
      context,
    });
  }
  
  return result.data!;
};

/**
 * Format Zod error details
 */
export const formatZodErrorDetails = (error: ZodError): ValidationErrorDetail[] => {
  return error.issues.map((err: any) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code,
    received: err.code === 'invalid_type' ? err.received : undefined,
    expected: err.code === 'invalid_type' ? err.expected : undefined,
  }));
};

/**
 * Create field-specific error messages
 */
export const createFieldErrorMessages = (errors: ValidationErrorDetail[]): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  errors.forEach((error) => {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }
  });
  
  return fieldErrors;
};

/**
 * Validate multiple schemas and combine results
 */
export const validateMultiple = (validations: Array<{
  schema: ZodSchema;
  data: unknown;
  context: string;
}>): ValidationResult<any[]> => {
  const results: any[] = [];
  const allErrors: ValidationErrorDetail[] = [];
  
  for (const validation of validations) {
    const result = validateRequestData(validation.schema, validation.data, validation.context);
    
    if (result.success) {
      results.push(result.data);
    } else {
      allErrors.push(...result.error!.details);
    }
  }
  
  if (allErrors.length > 0) {
    return {
      success: false,
      error: {
        message: 'Multiple validation errors occurred',
        details: allErrors,
      },
    };
  }
  
  return {
    success: true,
    data: results,
  };
};

/**
 * Validate request parts (body, params, query)
 */
export const validateRequestParts = (
  request: FastifyRequest,
  schemas: {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
  }
): ValidationResult<{
  body?: any;
  params?: any;
  query?: any;
}> => {
  const validations: Array<{
    schema: ZodSchema;
    data: unknown;
    context: string;
  }> = [];
  
  if (schemas.body) {
    validations.push({
      schema: schemas.body,
      data: request.body,
      context: 'body',
    });
  }
  
  if (schemas.params) {
    validations.push({
      schema: schemas.params,
      data: request.params,
      context: 'params',
    });
  }
  
  if (schemas.query) {
    validations.push({
      schema: schemas.query,
      data: request.query,
      context: 'query',
    });
  }
  
  const result = validateMultiple(validations);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }
  
  const validatedData: any = {};
  let index = 0;
  
  if (schemas.body) {
    validatedData.body = result.data![index++];
  }
  
  if (schemas.params) {
    validatedData.params = result.data![index++];
  }
  
  if (schemas.query) {
    validatedData.query = result.data![index++];
  }
  
  return {
    success: true,
    data: validatedData,
  };
};

/**
 * Sanitization helpers
 */
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize SQL injection attempts
 */
export const sanitizeSql = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\-]|(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi, '')
    .trim();
};

/**
 * Validate and sanitize search terms
 */
export const validateSearchTerm = (term: string, maxLength: number = 255): string => {
  if (typeof term !== 'string') {
    throw new ValidationError('Search term must be a string');
  }
  
  const sanitized = term.trim();
  
  if (sanitized.length === 0) {
    throw new ValidationError('Search term cannot be empty');
  }
  
  if (sanitized.length > maxLength) {
    throw new ValidationError(`Search term must be less than ${maxLength} characters`);
  }
  
  // Remove potentially dangerous characters
  return sanitized.replace(/[<>'";&\\]/g, '');
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): { page: number; limit: number } => {
  let validPage = 1;
  let validLimit = 50;
  
  // Validate page
  if (page !== undefined) {
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    if (!isNaN(pageNum) && pageNum >= 1) {
      validPage = pageNum;
    }
  }
  
  // Validate limit
  if (limit !== undefined) {
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    if (!isNaN(limitNum) && limitNum >= 1 && limitNum <= maxLimit) {
      validLimit = limitNum;
    }
  }
  
  return { page: validPage, limit: validLimit };
};

/**
 * Validate sort parameters
 */
export const validateSort = (
  sortBy?: string,
  sortOrder?: string,
  allowedFields: string[] = []
): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
  let validSortBy = allowedFields[0] || 'id';
  let validSortOrder: 'asc' | 'desc' = 'asc';
  
  // Validate sortBy
  if (sortBy && allowedFields.includes(sortBy)) {
    validSortBy = sortBy;
  }
  
  // Validate sortOrder
  if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
    validSortOrder = sortOrder;
  }
  
  return { sortBy: validSortBy, sortOrder: validSortOrder };
};

/**
 * Validate UUID format
 */
export const validateUuid = (uuid: string, fieldName: string = 'ID'): string => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
  
  return uuid;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  return email.toLowerCase().trim();
};

/**
 * Validate date range
 */
export const validateDateRange = (
  dateFrom?: string,
  dateTo?: string
): { dateFrom?: Date; dateTo?: Date } => {
  let validDateFrom: Date | undefined;
  let validDateTo: Date | undefined;
  
  if (dateFrom) {
    validDateFrom = new Date(dateFrom);
    if (isNaN(validDateFrom.getTime())) {
      throw new ValidationError('Invalid dateFrom format');
    }
  }
  
  if (dateTo) {
    validDateTo = new Date(dateTo);
    if (isNaN(validDateTo.getTime())) {
      throw new ValidationError('Invalid dateTo format');
    }
  }
  
  if (validDateFrom && validDateTo && validDateFrom > validDateTo) {
    throw new ValidationError('dateFrom must be before or equal to dateTo');
  }
  
  return { dateFrom: validDateFrom, dateTo: validDateTo };
};

/**
 * Create validation summary for logging
 */
export const createValidationSummary = (errors: ValidationErrorDetail[]): string => {
  const fieldCount = new Set(errors.map(e => e.field)).size;
  const errorCount = errors.length;
  
  return `Validation failed: ${errorCount} error(s) across ${fieldCount} field(s)`;
};