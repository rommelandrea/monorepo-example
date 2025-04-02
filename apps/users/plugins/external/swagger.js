import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export default fp(
  async (fastify, opts) => {
    // Have to register the two plugins in the same file
    // because swaggerUi is dependent on Swagger
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'users-service',
          description: 'API for users-service',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      ...opts,
    });

    fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      logLevel: 'error',
      ...opts,
    });
  },
  { name: 'fastifySwagger' },
);
