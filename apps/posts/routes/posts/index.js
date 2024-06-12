export default async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { root: 'this is a blog post' };
  });
}
