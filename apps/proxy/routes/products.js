import proxy from '@fastify/http-proxy';

export default async function (fastify, opts) {
  fastify.register(proxy, {
    prefix: '/api/v1/products',
    rewritePrefix: '/api/v1/products',
    upstream: process.env.PRODUCTS_URL || 'http://127.0.0.1:3002'
  });
}
