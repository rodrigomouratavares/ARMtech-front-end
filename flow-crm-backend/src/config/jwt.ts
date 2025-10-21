import { z } from 'zod';

/**
 * JWT configuration schema
 */
const jwtConfigSchema = z.object({
  secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  expiresIn: z.string().default('24h'),
  issuer: z.string().default('flow-crm-backend'),
});

/**
 * JWT configuration
 */
const rawJwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-minimum-32-chars',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  issuer: process.env.JWT_ISSUER || 'flow-crm-backend',
};

// Validate and export JWT configuration
export const jwtConfig = jwtConfigSchema.parse(rawJwtConfig);

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  iat?: number;
  exp?: number;
  iss?: string;
}