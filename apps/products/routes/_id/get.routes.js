import camelcaseKeys from 'camelcase-keys';
import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);
  const listUsersSchema = {
    tags: ['products'],
    summary: 'Products by ID',
    description: 'Retrieve a product by ID.',
    params: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      200: {
        description: 'product retrieved successfully',
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
    { schema: listUsersSchema },
    async (request, _reply) => {
      try {
        const { id } = request.params;
        const { rows } = await fastifyInstance.db.query(
          'SELECT * FROM products WHERE id = $1',
          [id],
        );
        return camelcaseKeys(rows);
      } catch (err) {
        fastifyInstance.log.error(err);
        return fastifyInstance.httpErrors.internalServerError({
          error: 'Internal Server Error',
          requestId: fastifyInstance.requestId,
        });
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
