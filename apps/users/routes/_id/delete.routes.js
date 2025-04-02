import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const deleteUserSchema = {
    tags: ['users'],
    summary: 'Delete a user',
    description: 'Delete a user from the system.',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'number' },
      },
    },
    response: {
      204: {
        description: 'User deleted successfully',
      },
      404: {
        description: 'User not found',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      500: {
        description: 'Internal Server Error',
        type: 'object',
        properties: {
          error: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  };

  fastifyInstance.delete(
    '',
    { schema: deleteUserSchema },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const result = await fastifyInstance.db.query(
          'DELETE FROM users WHERE id=$1 RETURNING id',
          [id],
        );

        if (result.rows.length === 0) {
          reply.code(404);
          return { error: 'User not found' };
        }

        const routingKey = 'demo.users.delete';

        const msg = {
          event_type: 'DELETE',
          entity_type: 'users',
          entity_id: id,
          data: {},
          timestamp: new Date().toISOString(),
        };

        await fastifyInstance.mq.publisher.send(
          {
            exchange: fastifyInstance.config.RABBIT_EXCHANGE_NAME,
            routingKey,
          },
          msg,
        );

        reply.code(204);
        return;
      } catch (err) {
        fastifyInstance.log.error(err);
        reply.code(500);
        return { error: 'Internal Server Error', requestId: request.id };
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
