import fp from 'fastify-plugin';
import db from '../plugins/custom/db.js';

const subscriber = async (fastify, opts) => {
  fastify.register(db, {
    ...opts,
    dbConfig: fastify.basicDBConfig,
  });
  const sub = fastify.mq.rabbitmq.createConsumer(
    {
      queue: 'cart-users-events',
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
          routingKey: 'demo.users.*',
        },
      ],
      // With a "topic" exchange, messages matching this pattern are routed to the queue
      // queueBindings: [{ exchange: RABBIT_EXCHANGE_NAME, routingKey: routingPattern }],
    },
    async (msg) => {
      try {
        console.log('🔥 received message: ', msg?.body);

        const { event_type, entity_id } = msg.body;
        if (event_type === 'DELETE') {
          await deleteUser(fastify, entity_id);
        }
      } catch (err) {
        // Reject the message and requeue it
        fastify.log.error('Error processing message', err);
      }
    },
  );
  fastify.addHook('onClose', () => sub.close());
};

const deleteUser = async (fastify, id) => {
  try {
    const carts = await fastify.db.query(
      'SELECT * FROM carts WHERE user_id=$1',
      [id],
    );
    if (carts.rows.length === 0) {
      return;
    }

    const result = await fastify.db.query(
      'DELETE FROM carts WHERE user_id=$1 RETURNING id',
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error('Cart not found');
    }
  } catch (err) {
    fastify.log.error(err, `Error deleting cart for user id: ${id}`);
  }
};

export default fp(subscriber, {
  name: 'subscriber-users',
  encapsulate: true,
  dependencies: ['rabbitmq', 'appConfig'],
});
