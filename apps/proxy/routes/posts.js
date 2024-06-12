import proxy from '@fastify/http-proxy';

export default async function (fastify, opts) {
  fastify.register(proxy, {
    prefix: '/api/v1/posts',
    rewritePrefix: '/api/v1/posts',
    upstream: process.env.POSTS || 'http://127.0.0.1:3001'
  });
}
