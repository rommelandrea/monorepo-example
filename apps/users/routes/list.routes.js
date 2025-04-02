import camelcaseKeys from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);
  const listUsersSchema = {
    tags: ['users'],
    summary: 'List all users',
    description: 'Retrieve a list of all users in the system.',
    response: {
      200: {
        description: 'List of users retrieved successfully',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
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
      const { rows } = await fastifyInstance.db.query(
        'SELECT id, username, email, created_at, updated_at FROM users',
      );
      return camelcaseKeys(rows);
    } catch (err) {
      fastifyInstance.log.error(err);
      throw new Error('Internal Server Error');
    }
  });
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
