import { createHmac } from 'node:crypto';
import camelcaseKeys from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const createUserSchema = {
    tags: ['users'],
    summary: 'Create a new user',
    description: 'Create a new user in the system.',
    body: {
      required: ['username', 'email', 'password'],
      type: 'object',
      properties: {
        username: {
          type: 'string',
          minLength: 3,
          maxLength: 50,
        },
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
      201: {
        description: 'User created successfully',
        type: 'object',
        properties: {
          id: { type: 'number' },
          username: { type: 'string' },
          email: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      409: {
        description: 'Conflict',
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

  fastifyInstance.post(
    '',
    { schema: createUserSchema },
    async (request, reply) => {
      const { username, email, password } = request.body;

      try {
        // Hash the password
        const salt = 'bz83tgchyasj24kp';
        const digest = 'sha256';
        const hash = createHmac(digest, salt).update(password).digest('hex');

        const text =
          'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING id, username, email, created_at, updated_at';
        const values = [username, email, hash];

        const { rows } = await fastifyInstance.db.query(text, values);
        reply.code(201);
        return camelcaseKeys(rows[0]);
      } catch (err) {
        // Handle unique constraint violations
        if (err.code === '23505') {
          if (err.constraint === 'users_username_key') {
            reply.code(409);
            return { error: 'Username already exists' };
          }
          if (err.constraint === 'users_email_key') {
            reply.code(409);
            return { error: 'Email already exists' };
          }
        }

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
