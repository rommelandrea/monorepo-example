import fp from 'fastify-plugin';
import db from '../plugins/custom/db.js';

const subscriber = async (fastify, opts) => {
  fastify.register(db, {
    ...opts,
    dbConfig: fastify.basicDBConfig,
  });
  const sub = fastify.mq.rabbitmq.createConsumer(
    {
      queue: 'cart-orders-events',
      queueOptions: { durable: false },
      // handle 2 messages at a time
      qos: { prefetchCount: 2 },
      // Optionally ensure an exchange exists
      exchanges: [
        {
          exchange: fastify.config.RABBIT_EXCHANGE_NAME,
          type: 'topic',
        },
      ],
      queueBindings: [
        {
          exchange: fastify.config.RABBIT_EXCHANGE_NAME,
          routingKey: 'demo.orders.*',
        },
      ],
      // With a "topic" exchange, messages matching this pattern are routed to the queue
      // queueBindings: [{ exchange: RABBIT_EXCHANGE_NAME, routingKey: routingPattern }],
    },
    async (msg) => {
      try {
        const { event_type, entity_id } = msg.body;
        if (event_type === 'CREATED') {
          await deleteCart(fastify, entity_id);
        }
      } catch (err) {
        fastify.log.error('Error processing message', err);
      }
    },
  );
  fastify.addHook('onClose', () => sub.close());
};

const deleteCart = async (fastify, id) => {
  try {
    const result = await fastify.db.query(
      'DELETE FROM carts WHERE user_id=$1 RETURNING id',
      [id],
    );
    fastify.log.info(
      `Deleted cart for user id: ${id}, result: ${JSON.stringify(result.rows)}`,
    );
  } catch (err) {
    fastify.log.error(err, `Error deleting cart for user id: ${id}`);
  }
};

export default fp(subscriber, {
  name: 'subscriber-orders',
  encapsulate: true,
  dependencies: ['rabbitmq', 'appConfig'],
});
