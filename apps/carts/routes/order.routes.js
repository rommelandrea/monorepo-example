import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const createOrderFromCartSchema = {
    tags: ['carts'],
    summary: 'Create an order from the cart',
    description: 'Create an order from the cart by user ID.',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  };

  fastifyInstance.put(
    '/:id/order',
    { schema: createOrderFromCartSchema },
    async (req) => {
      const id = req.params.id;

      const { rows } = await fastifyInstance.db.query(
        'SELECT * FROM carts WHERE id=$1',
        [id],
      );
      if (rows.length === 0) {
        throw fastifyInstance.httpErrors.notFound(
          `No cart found with ID: ${id}`,
        );
      }
      const cart = rows[0];
      const routingKey = 'demo.orders.create';

      const msg = {
        event_type: 'CREATE',
        entity_type: 'orders',
        entity_id: id,
        data: cart,
        timestamp: new Date().toISOString(),
      };

      await fastifyInstance.mq.publisher.send(
        {
          exchange: fastifyInstance.config.RABBIT_EXCHANGE_NAME,
          routingKey,
        },
        msg,
      );

      return rows[0];
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
