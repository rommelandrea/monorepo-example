import { createHmac } from 'node:crypto';
import camelcaseKeys from 'camelcase-keys';
import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const updateUserSchema = {
    tags: ['users'],
    summary: 'Update a user',
    description: 'Update a user in the system.',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    body: {
      required: ['email', 'password'],
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
        },
        password: {
          type: 'string',
          minLength: 6,
        },
      },
    },
    response: {
      200: {
        description: 'User updated successfully',
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

  fastifyInstance.put(
    '',
    { schema: updateUserSchema },
    async (request, reply) => {
      try {
        const salt = 'bz83tgchyasj24kp';
        const digest = 'sha256';

        const user = await fastifyInstance.db.query(
          'SELECT * FROM users WHERE id=$1',
          [request.params.id],
        );

        if (user.rows.length === 0) {
          reply.code(404);
          return { error: 'User not found' };
        }
        const { email, password } = request.body;
        const hash = createHmac(digest, salt).update(password).digest('hex');

        const text =
          'UPDATE users SET email=$1, password_hash=$2 WHERE id=$3 RETURNING id, username, email, created_at, updated_at';
        const values = [email, hash, request.params.id];
        const result = await fastifyInstance.db.query(text, values);
        if (result.rows.length === 0) {
          reply.code(404);
          return { error: 'User not found' };
        }
        reply.code(200);

        return camelcaseKeys(result.rows[0]);
      } catch (err) {
        // Handle other errors
        request.log.error(err);
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
