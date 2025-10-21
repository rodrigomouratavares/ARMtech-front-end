# Error Handling and Validation System

This document describes the comprehensive error handling and validation system implemented for the Flow CRM Backend.

## Overview

The system provides:
- Global error handling with consistent error responses
- Zod-based request validation middleware
- Custom error types for different scenarios
- Sanitization and security features
- Comprehensive logging and debugging support

## Error Handling

### Custom Error Types

The system defines several custom error types in `src/types/error.types.ts`:

```typescript
// Base application error
class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;
}

// Specific error types
class ValidationError extends AppError
class AuthenticationError extends AppError
class AuthorizationError extends AppError
class NotFoundError extends AppError
class ConflictError extends AppError
class DatabaseError extends AppError
```

### Global Error Handler

The global error handler (`src/utils/error-handler.ts`) provides:

- Consistent error response format
- Different handling for different error types
- Environment-specific error details (more details in development)
- Proper HTTP status code mapping
- Database error detection and handling
- Security-conscious error messages in production

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (optional)
    }
  },
  "timestamp": "2024-01-10T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Usage Example

```typescript
import { AppError, ValidationError } from '../types/error.types';

// Throw custom errors
throw new ValidationError('Invalid input data', { field: 'email' });
throw new AppError('Custom error', 400, 'CUSTOM_ERROR');

// Errors are automatically handled by the global error handler
```

## Validation System

### Validation Middleware

The validation middleware (`src/utils/validation-middleware.ts`) provides:

- Zod schema validation for request parts (body, params, query, headers)
- Automatic data transformation and sanitization
- Detailed validation error messages
- Security features (XSS prevention)

### Middleware Usage

```typescript
import { validateBody, validateParams, validateQuery } from '../utils/validation-middleware';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  age: z.number().min(18),
});

const userIdSchema = z.object({
  id: z.string().uuid(),
});

// Use in routes
fastify.post('/users', {
  preHandler: [
    validateBody(createUserSchema),
    validateParams(userIdSchema)
  ]
}, async (request, reply) => {
  // request.body and request.params are now validated and transformed
  const userData = request.body; // TypeScript knows the exact type
  const { id } = request.params;
});
```

### Validation Helpers

The validation helpers (`src/utils/validation-helpers.ts`) provide utility functions:

```typescript
import { validateData, validateRequestData, validatePagination } from '../utils/validation-helpers';

// Validate data and throw on error
const validData = validateData(schema, data);

// Validate data and return result object
const result = validateRequestData(schema, data, 'user data');
if (!result.success) {
  console.log('Validation errors:', result.error.details);
}

// Validate pagination parameters
const { page, limit } = validatePagination(request.query.page, request.query.limit);

// Validate UUID format
const validId = validateUuid(id, 'User ID');
```

### Sanitization Features

The system includes built-in sanitization:

- HTML/XSS prevention
- SQL injection pattern removal
- Input normalization (whitespace, case)
- Dangerous character removal

```typescript
// Automatic sanitization in validation middleware
const middleware = validateBody(schema, { sanitize: true });

// Manual sanitization
import { sanitizeHtml, sanitizeSql } from '../utils/validation-helpers';

const cleanHtml = sanitizeHtml(userInput);
const cleanSql = sanitizeSql(searchTerm);
```

## Plugin Integration

### Error Handler Plugin

```typescript
// src/plugins/error-handler.plugin.ts
import errorHandlerPlugin from './plugins/error-handler.plugin';

fastify.register(errorHandlerPlugin);
```

### Validation Plugin

```typescript
// src/plugins/validation.plugin.ts
import validationPlugin from './plugins/validation.plugin';

fastify.register(validationPlugin);

// Access validation utilities
fastify.validation.validateData(schema, data);
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// Good
throw new ValidationError('Email is required');
throw new NotFoundError('User not found');

// Avoid
throw new Error('Something went wrong');
```

### 2. Provide Detailed Validation Schemas

```typescript
const userSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .transform(email => email.toLowerCase()),
  
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name too long')
    .trim()
    .transform(name => name.replace(/\s+/g, ' ')),
});
```

### 3. Handle Errors Appropriately

```typescript
// In route handlers
try {
  const result = await service.createUser(userData);
  return sendSuccess(reply, result, 'User created successfully', 201);
} catch (error) {
  // Let global error handler manage the error
  throw error;
}

// In service layer
if (!user) {
  throw new NotFoundError('User not found');
}

if (existingEmail) {
  throw new ConflictError('Email already exists');
}
```

### 4. Use Validation Middleware Consistently

```typescript
// Always validate inputs
fastify.post('/endpoint', {
  preHandler: [
    validateBody(bodySchema),
    validateParams(paramsSchema),
    validateQuery(querySchema)
  ]
}, handler);
```

### 5. Log Errors Appropriately

```typescript
// The global error handler automatically logs errors
// Additional logging can be added in the error handler plugin

fastify.addHook('onError', async (request, reply, error) => {
  // Custom error logging logic
  if (error instanceof AppError && error.isOperational) {
    fastify.log.warn('Operational error:', error.message);
  } else {
    fastify.log.error('Unexpected error:', error);
  }
});
```

## Security Considerations

1. **Error Information Disclosure**: Production errors hide sensitive details
2. **Input Sanitization**: Automatic XSS and injection prevention
3. **Validation**: All inputs are validated before processing
4. **Rate Limiting**: Basic rate limiting validation helper included
5. **Logging**: Sensitive data is excluded from error logs

## Testing Error Handling

```typescript
// Test validation errors
const result = await fastify.inject({
  method: 'POST',
  url: '/users',
  payload: { invalid: 'data' }
});

expect(result.statusCode).toBe(422);
expect(result.json().error.code).toBe('VALIDATION_ERROR');

// Test custom errors
const service = new UserService();
await expect(service.createUser(invalidData))
  .rejects
  .toThrow(ValidationError);
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls error detail level (development vs production)
- Error logging can be configured through Fastify logger options

### Customization

The error handling and validation system can be extended:

1. Add new error types in `src/types/error.types.ts`
2. Extend validation middleware in `src/utils/validation-middleware.ts`
3. Add custom validation helpers in `src/utils/validation-helpers.ts`
4. Modify error response format in `src/utils/error-handler.ts`

## Integration with Existing Code

The error handling and validation system integrates seamlessly with existing:

- Response helpers (`src/utils/response-helpers.ts`)
- Authentication middleware
- Database operations
- Business logic services

All existing error handling patterns are preserved while adding comprehensive validation and error management capabilities.