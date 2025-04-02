import fp from 'fastify-plugin';
import db from '../plugins/custom/db.js';

const subscriber = async (fastify, opts) => {
  fastify.register(db, {
    ...opts,
    dbConfig: fastify.basicDBConfig,
  });

  const sub = fastify.mq.rabbitmq.createConsumer(
    {
      queue: 'product-orders-events',
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
    },
    async (msg) => {
      try {
        console.log('🔥 received message: ', msg?.body);

        const { event_type, data } = msg.body;
        if (event_type === 'CREATE') {
          await updateProducts(fastify, data);
        }
      } catch (err) {
        // Reject the message and requeue it
        fastify.log.error('Error processing message', err);
      }
    },
  );
  fastify.addHook('onClose', () => sub.close());
};

const updateProducts = async (fastify, data) => {
  try {
    for (const product of data.items) {
      const { productId, quantity } = product;
      await fastify.db.query(
        'UPDATE products SET stock=stock-$1, updated_at = NOW() WHERE id=$2 RETURNING id',
        [quantity, productId],
      );
    }
    fastify.log.info(
      `Products updated successfully: userId: ${data.user_id} items: ${data.items.map(
        (item) => item.productId,
      )}`,
    );
  } catch (error) {
    fastify.log.error(error);
  }
};

export default fp(subscriber, {
  name: 'subscriber',
  encapsulate: true,
  dependencies: ['rabbitmq', 'appConfig'],
});
