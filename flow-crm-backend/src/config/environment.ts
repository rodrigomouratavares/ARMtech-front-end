import { z } from 'zod';
import 'dotenv/config';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().default('3000').transform(Number).pipe(z.number().min(1).max(65535)),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format').default('postgresql://user:password@localhost:5432/mydb'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default('supersecretjwtkeythatisatleastthirtytwocharacterslong'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  FRONTEND_URL: z.string().url('Invalid FRONTEND_URL format').optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

function validateEnvironment(): Environment {
  try {
    // Debug: log current NODE_ENV value
    console.log('Current NODE_ENV:', process.env.NODE_ENV);
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('NODE')));

    return environmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        (err: any) => `${err.path.join('.')}: ${err.message}`
      );
      console.error('Environment validation error details:', {
        NODE_ENV: process.env.NODE_ENV,
        type: typeof process.env.NODE_ENV,
        issues: error.issues
      });
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      );
    }
    throw error;
  }
}

export const env = validateEnvironment();