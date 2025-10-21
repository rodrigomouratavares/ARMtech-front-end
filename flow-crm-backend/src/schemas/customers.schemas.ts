import { z, ZodError } from 'zod';
import { validateCpf } from '../utils/cpf-cnpj-validator';

/**
 * Zod validation schemas for customers
 */

// CPF validation function for Zod
const cpfValidation = (cpf: string) => {
  return validateCpf(cpf);
};

// Base customer schema with common fields
const baseCustomerSchema = {
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .transform(name => name.replace(/\s+/g, ' ')), // Normalize whitespace

  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .transform(email => email.toLowerCase().trim()),

  phone: z
    .string()
    .min(10, 'Phone must be at least 10 characters')
    .max(20, 'Phone must be less than 20 characters')
    .trim()
    .regex(/^[\d\s\-\(\)\+]+$/, 'Phone must contain only numbers, spaces, hyphens, parentheses, and plus signs'),

  cpf: z
    .string()
    .min(11, 'CPF must have at least 11 digits')
    .max(14, 'CPF must be less than 14 characters')
    .trim()
    .regex(/^[\d\.\-]+$/, 'CPF must contain only numbers, dots, and hyphens')
    .refine(cpfValidation, 'Invalid CPF format or check digits'),

  address: z
    .string()
    .max(1000, 'Address must be less than 1000 characters')
    .trim()
    .optional()
    .nullable()
    .transform(address => address === '' ? null : address)
};

// Create customer schema
export const createCustomerSchema = z.object({
  ...baseCustomerSchema,
  // All fields are required for creation except address
}).strict(); // Prevent additional properties

// Update customer schema
export const updateCustomerSchema = z.object({
  name: baseCustomerSchema.name.optional(),
  email: baseCustomerSchema.email.optional(),
  phone: baseCustomerSchema.phone.optional(),
  cpf: baseCustomerSchema.cpf.optional(),
  address: baseCustomerSchema.address
}).strict() // Prevent additional properties
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );

// Customer response schema
export const customerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  cpf: z.string(),
  address: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Customer query filters schema
export const customerFiltersSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val >= 1, 'Page must be greater than 0'),

  limit: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 50)
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),

  sortBy: z
    .enum(['name', 'email', 'createdAt'], {
      message: 'Sort field must be name, email, or createdAt'
    })
    .optional()
    .default('name'),

  sortOrder: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc'
    })
    .optional()
    .default('asc'),

  name: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 255, 'Name filter must be less than 255 characters'),

  email: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 255, 'Email filter must be less than 255 characters'),

  cpf: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 14, 'CPF filter must be less than 14 characters'),

  search: z
    .string()
    .trim()
    .optional()
    .transform(val => {
      // Treat empty strings, 'string', 'undefined', 'null' as undefined
      if (!val || val === '' || val === 'string' || val === 'undefined' || val === 'null') {
        return undefined;
      }
      return val;
    })
    .refine(val => !val || val.length <= 255, 'Search term must be less than 255 characters')
});

// Customer ID parameter schema
export const customerIdSchema = z.object({
  id: z
    .string()
    .uuid('Invalid customer ID format')
});

// Paginated customers response schema
export const paginatedCustomersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(customerResponseSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  }),
  message: z.string().optional(),
  timestamp: z.string()
});

// Success response schema
export const customerSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: customerResponseSchema,
  message: z.string().optional(),
  timestamp: z.string()
});

// Error response schema
export const customerErrorResponseSchema = z.object({
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }),
  timestamp: z.string(),
  path: z.string().optional()
});

// Validation error details schema
export const validationErrorDetailsSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.any().optional()
});

// Type exports
export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerSchema>;
export type CustomerResponse = z.infer<typeof customerResponseSchema>;
export type CustomerFilters = z.infer<typeof customerFiltersSchema>;
export type CustomerIdParams = z.infer<typeof customerIdSchema>;
export type PaginatedCustomersResponse = z.infer<typeof paginatedCustomersResponseSchema>;
export type CustomerSuccessResponse = z.infer<typeof customerSuccessResponseSchema>;
export type CustomerErrorResponse = z.infer<typeof customerErrorResponseSchema>;
export type ValidationErrorDetails = z.infer<typeof validationErrorDetailsSchema>;

// Custom validation functions
export const validateCustomerEmail = async (email: string, excludeId?: string): Promise<boolean> => {
  // This would typically check against the database
  // For now, we'll implement basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateCustomerCpf = (cpf: string): boolean => {
  return validateCpf(cpf);
};

// Schema validation helpers
export const validateCreateCustomer = (data: unknown) => {
  return createCustomerSchema.safeParse(data);
};

export const validateUpdateCustomer = (data: unknown) => {
  return updateCustomerSchema.safeParse(data);
};

export const validateCustomerFilters = (data: unknown) => {
  return customerFiltersSchema.safeParse(data);
};

export const validateCustomerId = (data: unknown) => {
  return customerIdSchema.safeParse(data);
};

// Error message helpers
export const getValidationErrorMessage = (error: ZodError): string => {
  const firstError = error.issues[0];
  return firstError?.message || 'Validation failed';
};

export const getValidationErrorDetails = (error: ZodError): ValidationErrorDetails[] => {
  return error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    value: err.code === 'invalid_type' ? undefined : err.input
  }));
};