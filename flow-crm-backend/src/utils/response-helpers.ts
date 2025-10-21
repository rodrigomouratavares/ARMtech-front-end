import { FastifyReply } from 'fastify';

/**
 * Standard response helper functions for consistent API responses
 */

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
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
 * Send a successful response
 * @param reply - Fastify reply object
 * @param data - Response data
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  reply: FastifyReply,
  data: T,
  message?: string,
  statusCode: number = 200
): FastifyReply => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return reply.status(statusCode).send(response);
};

/**
 * Send a created response (201)
 * @param reply - Fastify reply object
 * @param data - Created resource data
 * @param message - Optional success message
 */
export const sendCreated = <T>(
  reply: FastifyReply,
  data: T,
  message?: string
): FastifyReply => {
  return sendSuccess(reply, data, message || 'Resource created successfully', 201);
};

/**
 * Send a no content response (204)
 * @param reply - Fastify reply object
 */
export const sendNoContent = (reply: FastifyReply): FastifyReply => {
  return reply.status(204).send();
};

/**
 * Send an error response
 * @param reply - Fastify reply object
 * @param code - Error code
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Optional error details
 * @param path - Optional request path
 */
export const sendError = (
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode: number,
  details?: any,
  path?: string
): FastifyReply => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    path,
  };

  return reply.status(statusCode).send(response);
};

/**
 * Send a bad request error (400)
 * @param reply - Fastify reply object
 * @param message - Error message
 * @param details - Optional error details
 */
export const sendBadRequest = (
  reply: FastifyReply,
  message: string = 'Bad Request',
  details?: any
): FastifyReply => {
  return sendError(reply, 'BAD_REQUEST', message, 400, details);
};

/**
 * Send an unauthorized error (401)
 * @param reply - Fastify reply object
 * @param message - Error message
 */
export const sendUnauthorized = (
  reply: FastifyReply,
  message: string = 'Unauthorized'
): FastifyReply => {
  return sendError(reply, 'UNAUTHORIZED', message, 401);
};

/**
 * Send a forbidden error (403)
 * @param reply - Fastify reply object
 * @param message - Error message
 */
export const sendForbidden = (
  reply: FastifyReply,
  message: string = 'Forbidden'
): FastifyReply => {
  return sendError(reply, 'FORBIDDEN', message, 403);
};

/**
 * Send a not found error (404)
 * @param reply - Fastify reply object
 * @param message - Error message
 */
export const sendNotFound = (
  reply: FastifyReply,
  message: string = 'Resource not found'
): FastifyReply => {
  return sendError(reply, 'NOT_FOUND', message, 404);
};

/**
 * Send a conflict error (409)
 * @param reply - Fastify reply object
 * @param message - Error message
 * @param details - Optional error details
 */
export const sendConflict = (
  reply: FastifyReply,
  message: string = 'Conflict',
  details?: any
): FastifyReply => {
  return sendError(reply, 'CONFLICT', message, 409, details);
};

/**
 * Send a validation error (422)
 * @param reply - Fastify reply object
 * @param message - Error message
 * @param details - Validation error details
 */
export const sendValidationError = (
  reply: FastifyReply,
  message: string = 'Validation failed',
  details?: any
): FastifyReply => {
  return sendError(reply, 'VALIDATION_ERROR', message, 422, details);
};

/**
 * Send an internal server error (500)
 * @param reply - Fastify reply object
 * @param message - Error message
 * @param details - Optional error details (should not include sensitive info)
 */
export const sendInternalError = (
  reply: FastifyReply,
  message: string = 'Internal Server Error',
  details?: any
): FastifyReply => {
  return sendError(reply, 'INTERNAL_ERROR', message, 500, details);
};

/**
 * Send a paginated response
 * @param reply - Fastify reply object
 * @param data - Array of items
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param message - Optional success message
 */
export const sendPaginated = <T>(
  reply: FastifyReply,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): FastifyReply => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const response = {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    },
    message,
    timestamp: new Date().toISOString(),
  };

  return reply.status(200).send(response);
};