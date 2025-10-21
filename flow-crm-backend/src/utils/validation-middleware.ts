import { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../types/error.types';

/**
 * Validation middleware for Fastify routes using Zod schemas
 */

/**
 * Validation options interface
 */
interface ValidationOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  querystring?: ZodSchema;
  headers?: ZodSchema;
  sanitize?: boolean;
  stripUnknown?: boolean;
}

/**
 * Create validation middleware for Fastify routes
 * @param options - Validation options with Zod schemas
 * @returns Fastify preHandler hook
 */
export const createValidationMiddleware = (
  options: ValidationOptions
): preHandlerHookHandler => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate and transform request body
      if (options.body && request.body !== undefined) {
        const result = options.body.safeParse(request.body);
        if (!result.success) {
          throw new ValidationError('Request body validation failed', {
            errors: formatZodErrors(result.error),
            field: 'body'
          });
        }
        // Replace request body with validated and transformed data
        request.body = result.data;
      }

      // Validate and transform request parameters
      if (options.params && request.params) {
        const result = options.params.safeParse(request.params);
        if (!result.success) {
          throw new ValidationError('Request parameters validation failed', {
            errors: formatZodErrors(result.error),
            field: 'params'
          });
        }
        // Replace request params with validated and transformed data
        request.params = result.data;
      }

      // Validate and transform query parameters
      if (options.querystring && request.query) {
        const result = options.querystring.safeParse(request.query);
        if (!result.success) {
          throw new ValidationError('Query parameters validation failed', {
            errors: formatZodErrors(result.error),
            field: 'querystring'
          });
        }
        // Replace request query with validated and transformed data
        request.query = result.data;
      }

      // Validate and transform headers
      if (options.headers && request.headers) {
        const result = options.headers.safeParse(request.headers);
        if (!result.success) {
          throw new ValidationError('Request headers validation failed', {
            errors: formatZodErrors(result.error),
            field: 'headers'
          });
        }
        // Note: We don't replace headers as they might be needed by other middleware
      }

      // Sanitize request data if enabled
      if (options.sanitize) {
        sanitizeRequest(request);
      }

    } catch (error) {
      // Re-throw validation errors to be handled by global error handler
      throw error;
    }
  };
};

/**
 * Format Zod validation errors into a more readable format
 */
const formatZodErrors = (error: ZodError) => {
  return error.issues.map((err: any) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code,
    received: err.code === 'invalid_type' ? err.received : undefined,
    expected: err.code === 'invalid_type' ? err.expected : undefined,
  }));
};

/**
 * Sanitize request data to prevent XSS and other security issues
 */
const sanitizeRequest = (request: FastifyRequest) => {
  // Sanitize body
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body);
  }

  // Sanitize query parameters
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeObject(request.query);
  }

  // Note: We don't sanitize params as they are usually UUIDs or specific formats
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize string values to prevent XSS
 */
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') {
    return str;
  }

  // Remove potentially dangerous HTML tags and scripts
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Validation middleware factory functions for common use cases
 */

/**
 * Create body validation middleware
 */
export const validateBody = (schema: ZodSchema, options?: { sanitize?: boolean }) => {
  return createValidationMiddleware({
    body: schema,
    sanitize: options?.sanitize ?? true,
  });
};

/**
 * Create params validation middleware
 */
export const validateParams = (schema: ZodSchema) => {
  return createValidationMiddleware({
    params: schema,
  });
};

/**
 * Create query validation middleware
 */
export const validateQuery = (schema: ZodSchema, options?: { sanitize?: boolean }) => {
  return createValidationMiddleware({
    querystring: schema,
    sanitize: options?.sanitize ?? true,
  });
};

/**
 * Create headers validation middleware
 */
export const validateHeaders = (schema: ZodSchema) => {
  return createValidationMiddleware({
    headers: schema,
  });
};

/**
 * Create combined validation middleware
 */
export const validate = (options: ValidationOptions) => {
  return createValidationMiddleware(options);
};

/**
 * Validation error formatter for consistent error responses
 */
export const formatValidationError = (error: ZodError, field?: string) => {
  return {
    code: 'VALIDATION_ERROR',
    message: `Validation failed${field ? ` for ${field}` : ''}`,
    details: {
      errors: formatZodErrors(error),
    },
  };
};

/**
 * Helper function to validate data without middleware (for service layer)
 */
export const validateData = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Data validation failed', {
      errors: formatZodErrors(result.error),
    });
  }
  return result.data;
};

/**
 * Helper function to validate data and return result (for conditional validation)
 */
export const safeValidateData = <T>(schema: ZodSchema<T>, data: unknown) => {
  return schema.safeParse(data);
};

/**
 * Create validation schema for pagination parameters
 */
export const createPaginationSchema = (defaultLimit: number = 50, maxLimit: number = 100) => {
  return {
    page: (value: string) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1 ? num : 1;
    },
    limit: (value: string) => {
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1 && num <= maxLimit ? num : defaultLimit;
    },
  };
};

/**
 * Validation middleware for file uploads (if needed in the future)
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // This would be implemented when file upload functionality is needed
    // For now, it's a placeholder for future use
  };
};

/**
 * Rate limiting validation (basic implementation)
 */
export const validateRateLimit = (options: {
  maxRequests: number;
  windowMs: number;
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    // Check current client
    const clientData = requests.get(clientId);
    if (!clientData) {
      requests.set(clientId, { count: 1, resetTime: now + options.windowMs });
      return;
    }

    if (clientData.resetTime < now) {
      // Reset window
      requests.set(clientId, { count: 1, resetTime: now + options.windowMs });
      return;
    }

    if (clientData.count >= options.maxRequests) {
      throw new ValidationError('Rate limit exceeded', {
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
  };
};