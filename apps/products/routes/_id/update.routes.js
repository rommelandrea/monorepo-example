import camelcaseKeys from 'camelcase-keys';
import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const createProductSchema = {
    tags: ['products'],
    summary: 'Update a product',
    description: 'Update a product by ID.',
    params: {
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    body: {
      required: ['name', 'price', 'stock'],
      type: 'object',
      properties: {
        name: {
          type: 'string',
          maxLength: 255,
        },
        description: {
          type: 'string',
          nullable: true,
        },
        price: {
          type: 'number',
          minimum: 0,
        },
        stock: {
          type: 'integer',
          minimum: 0,
        },
      },
    },
    response: {
      200: {
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
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  };

  fastifyInstance.post(
    '',
    { schema: createProductSchema },
    async (request, reply) => {
      try {
        const { name, description, price, stock } = request.body;

        const query = `
          UPDATE products
          SET name = $1, description = $2, price = $3, stock = $4, updatedAt = NOW()
          WHERE id = $5
          RETURNING *;
        `;

        const values = [name, description || null, price, stock];
        const result = await fastifyInstance.db.query(query, values);

        reply.code(200);
        return camelcaseKeys(result.rows[0]);
      } catch (error) {
        request.log.error(error);

        if (error.code === '23514') {
          // Check constraint violation
          reply.code(400);
          return {
            error:
              'Invalid product data. Price and stock must be non-negative.',
          };
        }

        reply.code(500);
        return {
          error: 'Internal Server Error',
          message: error.message,
          requestId: request.requestId,
        };
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
