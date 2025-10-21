import { FastifyPluginAsync } from 'fastify';

const validationPlugin: FastifyPluginAsync = async (fastify) => {
  // Validation plugin placeholder
  // This will be implemented when validation schemas are set up
  fastify.log.info('Validation plugin registered');
};

export default validationPlugin;