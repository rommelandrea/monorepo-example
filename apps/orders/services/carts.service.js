import fp from 'fastify-plugin';
import db from '../plugins/custom/db.js';

const subscriber = async (fastify, opts) => {
  fastify.register(db, {
    ...opts,
    dbConfig: fastify.basicDBConfig,
  });
  const sub = fastify.mq.rabbitmq.createConsumer(
    {
      queue: 'order-carts-events',
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
        console.log('🔥 received message: ', msg?.body);

        const { event_type, data } = msg.body;
        if (event_type === 'CREATE') {
          await createOrder(fastify, data);
        }
      } catch (err) {
        // Reject the message and requeue it
        fastify.log.error('Error processing message', err);
      }
    },
  );
  fastify.addHook('onClose', () => sub.close());
};

const createOrder = async (fastify, data) => {
  try {
    const { user_id, items } = data;
    const total = items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const result = await fastify.db.query(
      'INSERT INTO orders (user_id, items, total_price) VALUES ($1, $2, $3) RETURNING id',
      [user_id, JSON.stringify(items), total],
    );
    fastify.log.info(
      `Order created successfully: userId: ${user_id}, items: ${JSON.stringify(
        items,
      )}, total: ${total}`,
    );

    const routingKey = 'demo.orders.create';

    const msg = {
      event_type: 'CREATED',
      entity_type: 'orders',
      entity_id: data.user_id,
      data: {},
      timestamp: new Date().toISOString(),
    };

    await fastify.mq.publisher.send(
      {
        exchange: fastify.config.RABBIT_EXCHANGE_NAME,
        routingKey,
      },
      msg,
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
