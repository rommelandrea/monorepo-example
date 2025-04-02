import fastifyEnv from '@fastify/env';
import fastifyPlugin from 'fastify-plugin';

async function configPlugin(fastify, options) {
  const schema = {
    type: 'object',
    required: [
      'DB_HOST',
      'DB_USER',
      'DB_PASSWORD',
      'DATABASE',
      'RABBITMQ_URL',
      'RABBIT_EXCHANGE_NAME',
    ],
    properties: {
      PORT: { type: 'number', default: 3002 },
      NODE_ENV: { type: 'string', default: 'production' },
      DB_USER: { type: 'string' },
      DB_PASSWORD: { type: 'string' },
      DB_HOST: { type: 'string' },
      DB_PORT: { type: 'number', default: 5432 },
      DATABASE: { type: 'string' },
      RABBITMQ_URL: { type: 'string' },
      RABBIT_EXCHANGE_NAME: { type: 'string' },
    },
  };

  const configOptions = {
    confKey: 'config',
    schema: schema,
    data: process.env,
    dotenv: true,
    removeAdditional: true,
  };

  await fastify.register(fastifyEnv, configOptions);

  const commonDBConfig = {
    port: fastify.config.DB_PORT,
    host: fastify.config.DB_HOST,
    database: fastify.config.DATABASE,
  };
  fastify.decorate('basicDBConfig', {
    ...commonDBConfig,
    user: fastify.config.DB_USER,
    password: fastify.config.DB_PASSWORD,
  });
}

export default fastifyPlugin(configPlugin, { name: 'appConfig' });
