/** @param {import('fastify').FastifyInstance} fastify */
export default async (fastify, _opts) => {
  fastify.get('/example', async (_request, _reply) => {
    return { hello: fastify.example };
  });
};
