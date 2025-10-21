/**
 * Example usage of validation middleware and error handling
 * This file demonstrates how to use the validation system in routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../utils/validation-middleware';
import { sendSuccess, sendError } from '../utils/response-helpers';
import { AppError, ValidationError, NotFoundError } from '../types/error.types';

// Example schemas
const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  age: z.number().min(18).max(120),
});

const userIdSchema = z.object({
  id: z.string().uuid(),
});

const userFiltersSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  search: z.string().optional(),
});

/**
 * Example route registration with validation middleware
 */
export const registerExampleRoutes = (fastify: FastifyInstance) => {
  // POST /users - Create user with body validation
  fastify.post('/users', {
    preHandler: [
      validateBody(createUserSchema)
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // At this point, request.body is validated and transformed
      const userData = request.body as z.infer<typeof createUserSchema>;
      
      // Simulate user creation
      const newUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...userData,
        createdAt: new Date(),
      };
      
      return sendSuccess(reply, newUser, 'User created successfully', 201);
    } catch (error) {
      // Errors will be handled by the global error handler
      throw error;
    }
  });

  // GET /users/:id - Get user with params validation
  fastify.get('/users/:id', {
    preHandler: [
      validateParams(userIdSchema)
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as z.infer<typeof userIdSchema>;
      
      // Simulate user lookup
      if (id === '123e4567-e89b-12d3-a456-426614174000') {
        const user = {
          id,
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          createdAt: new Date(),
        };
        
        return sendSuccess(reply, user);
      } else {
        throw new NotFoundError('User not found');
      }
    } catch (error) {
      throw error;
    }
  });

  // GET /users - List users with query validation
  fastify.get('/users', {
    preHandler: [
      validateQuery(userFiltersSchema)
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const filters = request.query as z.infer<typeof userFiltersSchema>;
      
      // Simulate user listing with filters
      const users = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Jane Smith',
          email: 'jane@example.com',
          age: 25,
        },
      ];
      
      // Apply search filter if provided
      let filteredUsers = users;
      if (filters.search) {
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      
      // Apply pagination
      const startIndex = (filters.page - 1) * filters.limit;
      const endIndex = startIndex + filters.limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      return sendSuccess(reply, {
        users: paginatedUsers,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / filters.limit),
        },
      });
    } catch (error) {
      throw error;
    }
  });

  // Example route that demonstrates error handling
  fastify.get('/users/:id/error-demo', {
    preHandler: [
      validateParams(userIdSchema)
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as z.infer<typeof userIdSchema>;
    
    // Demonstrate different types of errors
    if (id === '00000000-0000-0000-0000-000000000001') {
      throw new ValidationError('Custom validation error', {
        field: 'id',
        reason: 'This ID is reserved for testing',
      });
    }
    
    if (id === '00000000-0000-0000-0000-000000000002') {
      throw new AppError('Custom application error', 400, 'CUSTOM_ERROR', {
        details: 'This is a custom error for demonstration',
      });
    }
    
    if (id === '00000000-0000-0000-0000-000000000003') {
      // Simulate database error
      throw new Error('duplicate key value violates unique constraint');
    }
    
    if (id === '00000000-0000-0000-0000-000000000004') {
      // Simulate unexpected error
      throw new Error('Something went wrong unexpectedly');
    }
    
    return sendSuccess(reply, { message: 'No error occurred' });
  });
};

/**
 * Example of manual validation in service layer
 */
export class ExampleService {
  static validateUserData(data: unknown) {
    try {
      return createUserSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('User data validation failed', {
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        });
      }
      throw error;
    }
  }
  
  static async createUser(userData: unknown) {
    // Validate input data
    const validatedData = this.validateUserData(userData);
    
    // Simulate business logic
    if (validatedData.email === 'admin@example.com') {
      throw new AppError('Cannot create user with admin email', 409, 'ADMIN_EMAIL_RESERVED');
    }
    
    // Simulate database operation
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      ...validatedData,
      createdAt: new Date(),
    };
  }
}

/**
 * Example of using validation helpers
 */
export const exampleValidationHelpers = () => {
  const { validateData, safeValidateData } = require('../utils/validation-helpers');
  
  // Example 1: Validate and throw on error
  try {
    const validUser = validateData(createUserSchema, {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });
    console.log('Valid user:', validUser);
  } catch (error) {
    console.error('Validation failed:', error);
  }
  
  // Example 2: Safe validation (returns result object)
  const result = safeValidateData(createUserSchema, {
    name: 'John Doe',
    email: 'invalid-email',
    age: 30,
  });
  
  if (result.success) {
    console.log('Valid user:', result.data);
  } else {
    console.log('Validation errors:', result.error);
  }
};