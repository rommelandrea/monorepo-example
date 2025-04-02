import fp from 'fastify-plugin';
import { Connection } from 'rabbitmq-client';

/**
 * This plugins adds the support to rabbitmq
 *
 * @see https://github.com/cody-greene/node-rabbitmq-client
 */
export default fp(
  async (fastify) => {
    const rabbitmq = new Connection(fastify.config.RABBITMQ_URL);
    fastify.addHook('onClose', () => rabbitmq.close());

    rabbitmq.on('connection', () => {
      fastify.log.info('connected to rabbitmq');
    });

    rabbitmq.on('error', () => {
      fastify.log.error('RabbitMQ Connection Failed!');
    });

    const pub = rabbitmq.createPublisher({
      // Enable publish confirmations, similar to consumer acknowledgements
      confirm: true,
      // Enable retries
      maxAttempts: 2,
      // Optionally ensure the existence of an exchange before we use it
      exchanges: [
        {
          exchange: fastify.config.RABBIT_EXCHANGE_NAME,
          type: 'topic',
        },
      ],
    });

    fastify.addHook('onClose', () => pub.close());

    fastify.decorate('mq', {
      rabbitmq,
      publisher: pub,
    });
  },
  {
    name: 'rabbitmq',
    dependencies: ['appConfig'],
  },
);
