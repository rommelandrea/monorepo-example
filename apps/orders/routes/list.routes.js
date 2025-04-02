import camelcaseKeys from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const listOrdersSchema = {
    description: 'List all orders',
    tags: ['orders'],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'integer' },
                  productId: { type: 'integer' },
                },
              },
            },
            totalPrice: { type: 'number' },
          },
        },
      },
    },
  };

  fastifyInstance.get('', { schema: listOrdersSchema }, async () => {
    const { rows } = await fastifyInstance.db.query('SELECT * FROM orders');
    return camelcaseKeys(rows);
  });
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
