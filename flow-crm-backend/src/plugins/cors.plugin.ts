import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/environment';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const allowedOrigins = [
    'http://localhost:5173', // Development
    'http://localhost:3000', // Development (alternative port)
    'http://127.0.0.1:5173', // Development (IP)
    'https://flow-crm-pearl.vercel.app', // Production
    env.FRONTEND_URL // Environment variable
  ].filter(Boolean); // Remove undefined values

  await fastify.register(cors, {
    origin: (origin, callback) => {
      console.log('CORS check for origin:', origin);

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('No origin - allowing');
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log('Origin in allowed list - allowing');
        return callback(null, true);
      }

      // Allow localhost in any form for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('Localhost origin - allowing');
        return callback(null, true);
      }

      // In development, allow all origins
      if (env.NODE_ENV === 'development') {
        console.log('Development mode - allowing all');
        return callback(null, true);
      }

      // Reject origin
      console.log('Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
};

export default corsPlugin;