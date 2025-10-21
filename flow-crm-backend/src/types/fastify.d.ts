import { User } from './auth.types';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            userId: string;
            email: string;
            role: 'admin' | 'manager' | 'employee';
        };
        user: User;
    }
}