import camelcaseKeys from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const getCartsSchema = {
    tags: ['carts'],
    description: 'Get all carts',
    summary: 'Get all carts',
    response: {
      200: {
        description: 'Carts retrieved successfully',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            userId: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'number' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                  name: { type: 'string' },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      500: {
        description: 'Internal Server Error',
        type: 'object',
        properties: {
          error: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  };

  fastifyInstance.get(
    '',
    { schema: getCartsSchema },
    async (request, reply) => {
      try {
        const { rows } = await fastifyInstance.db.query('SELECT * FROM carts');
        return camelcaseKeys(rows);
      } catch (error) {
        request.log.error(error);
        reply.code(500);
        return {
          error: 'Internal Server Error',
          requestId: request.id,
        };
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
