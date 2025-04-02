import fastifyPlugin from 'fastify-plugin';
import pg from 'pg';

export default fastifyPlugin(
  async (fastify, opts) => {
    const client = new pg.Client(opts.dbConfig);
    await client.connect();

    fastify.addHook('onClose', (_fastify, done) => client.end(done));
    fastify.decorate('db', client);
  },
  {
    dependencies: ['appConfig'],
  },
);

export const autoload = false;
