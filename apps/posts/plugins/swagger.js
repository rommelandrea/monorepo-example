import ScalarApiReference from '@scalar/fastify-api-reference';
import swagger from '@fastify/swagger';
import fp from 'fastify-plugin';

export default fp(async function (fastify, opts) {
  await fastify.register(swagger);
  await fastify.register(ScalarApiReference, {
    routePrefix: '/docs',
  });
});
