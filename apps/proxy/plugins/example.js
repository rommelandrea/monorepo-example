/** @param {import('fastify').FastifyInstance} fastify */
export default async (fastify, _opts) => {
  fastify.decorate('example', 'foobar');
};
