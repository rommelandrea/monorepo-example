import camelcaseKeys from 'camelcase-keys';
import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const oneUserSchema = {
    tags: ['users'],
    summary: 'Get a user by ID',
    description: 'Retrieve a user by their ID from the system.',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      200: {
        description: 'User retrieved successfully',
        type: 'object',
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      404: {
        description: 'User not found',
        type: 'object',
        properties: {
          error: { type: 'string' },
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

  fastifyInstance.get('', { schema: oneUserSchema }, async (request, reply) => {
    try {
      const { rows } = await fastifyInstance.db.query(
        'SELECT * FROM users WHERE id=$1',
        [request.params.id],
      );
      return camelcaseKeys(rows[0]);
    } catch (err) {
      fastifyInstance.log.error(err);
      reply.code(500);
      return { error: 'Internal Server Error', requestId: request.id };
    }
  });
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
