import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ERROR_CODES, HTTP_STATUS_CODES } from '../types/error.types';
import { ErrorResponse } from './response-helpers';
import { isPostgresError, createDatabaseError } from './database-error-handler';

/**
 * Global error handler for Fastify application
 */
export const globalErrorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log error for debugging (exclude sensitive information in production)
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      params: request.params,
      query: request.query,
      body: request.body,
    });
  } else {
    // In production, log only essential information
    console.error('Error occurred:', {
      message: error.message,
      url: request.url,
      method: request.method,
      statusCode: error.statusCode,
    });
  }

  // Handle different types of errors
  if (error instanceof AppError) {
    return handleAppError(error, request, reply);
  }

  if (error instanceof ZodError) {
    return handleZodError(error, request, reply);
  }

  if (error.statusCode === 400 && error.code === 'FST_ERR_VALIDATION') {
    return handleFastifyValidationError(error, request, reply);
  }

  if (error.statusCode === 401) {
    return handleAuthenticationError(error, request, reply);
  }

  if (error.statusCode === 403) {
    return handleAuthorizationError(error, request, reply);
  }

  if (error.statusCode === 404) {
    return handleNotFoundError(error, request, reply);
  }

  // Handle database errors
  if (isDatabaseError(error)) {
    return handleDatabaseError(error, request, reply);
  }

  // Handle unknown errors
  return handleUnknownError(error, request, reply);
};

/**
 * Handle custom application errors
 */
const handleAppError = (
  error: AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(error.statusCode).send(response);
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (
  error: ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const validationErrors = error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: {
        errors: validationErrors,
      },
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY).send(response);
};

/**
 * Handle Fastify validation errors
 */
const handleFastifyValidationError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Request validation failed',
      details: {
        validation: error.validation,
        validationContext: error.validationContext,
      },
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.BAD_REQUEST).send(response);
};

/**
 * Handle authentication errors
 */
const handleAuthenticationError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.UNAUTHORIZED,
      message: error.message || 'Authentication required',
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.UNAUTHORIZED).send(response);
};

/**
 * Handle authorization errors
 */
const handleAuthorizationError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.FORBIDDEN,
      message: error.message || 'Insufficient permissions',
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.FORBIDDEN).send(response);
};

/**
 * Handle not found errors
 */
const handleNotFoundError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: error.message || 'Resource not found',
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.NOT_FOUND).send(response);
};

/**
 * Handle database errors
 */
const handleDatabaseError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Use PostgreSQL-specific error mapping if it's a PostgreSQL error
  if (isPostgresError(error)) {
    const dbError = createDatabaseError(error);
    return handleAppError(dbError, request, reply);
  }

  // Fallback for generic database errors
  let errorCode: string = ERROR_CODES.DATABASE_ERROR;
  let message = 'Database operation failed';
  let statusCode: number = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

  // Handle unique constraint violations (fallback)
  if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
    errorCode = ERROR_CODES.DUPLICATE_RESOURCE;
    message = 'Resource already exists';
    statusCode = HTTP_STATUS_CODES.CONFLICT;
  }

  // Handle foreign key constraint violations (fallback)
  if (error.message.includes('foreign key constraint')) {
    errorCode = ERROR_CODES.CONSTRAINT_VIOLATION;
    message = 'Referenced resource does not exist';
    statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
  }

  // Handle check constraint violations (fallback)
  if (error.message.includes('check constraint')) {
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Data validation failed';
    statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      // Only include error details in development
      details: process.env.NODE_ENV !== 'production' ? {
        originalError: error.message,
      } : undefined,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(statusCode).send(response);
};

/**
 * Handle unknown errors
 */
const handleUnknownError = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'An unexpected error occurred',
      // Only include stack trace in development
      details: process.env.NODE_ENV !== 'production' ? {
        stack: error.stack,
      } : undefined,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send(response);
};

/**
 * Check if error is a database-related error
 */
const isDatabaseError = (error: FastifyError): boolean => {
  // First check if it's a PostgreSQL error
  if (isPostgresError(error)) {
    return true;
  }

  // Fallback to string matching for other database errors
  const databaseErrorIndicators = [
    'connection',
    'database',
    'constraint',
    'relation',
    'column',
    'table',
    'duplicate key',
    'foreign key',
    'check constraint',
    'not null',
    'unique constraint',
    'timeout',
    'pool',
  ];

  const errorMessage = error.message.toLowerCase();
  return databaseErrorIndicators.some(indicator =>
    errorMessage.includes(indicator)
  );
};

/**
 * Not found handler for unmatched routes
 */
export const notFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${request.method} ${request.url} not found`,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  return reply.status(HTTP_STATUS_CODES.NOT_FOUND).send(response);
};