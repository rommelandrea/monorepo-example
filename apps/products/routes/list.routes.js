import camelcaseKeys from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);
  const listUsersSchema = {
    tags: ['products'],
    summary: 'List all products',
    description: 'Retrieve a list of all products in the system.',
    response: {
      200: {
        description: 'List of products retrieved successfully',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            stock: { type: 'integer' },
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

  fastifyInstance.get('', { schema: listUsersSchema }, async () => {
    try {
      const { rows } = await fastifyInstance.db.query('SELECT * FROM products');
      return camelcaseKeys(rows);
    } catch (err) {
      fastifyInstance.log.error(err);
      return fastifyInstance.httpErrors.internalServerError({
        error: 'Internal Server Error',
        requestId: fastifyInstance.requestId,
      });
    }
  });
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
