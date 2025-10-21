import { FastifyPluginAsync } from 'fastify';
import jwt from '@fastify/jwt';
import { env } from '../config/environment';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
  });

  fastify.log.info('Auth plugin registered');
};

export default authPlugin;