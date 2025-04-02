import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const getUserCartSchema = {
    tags: ['carts'],
    description: 'Get user cart by user ID',
    summary: 'Get user cart',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  };

  fastifyInstance.get('', { schema: getUserCartSchema }, async (req) => {
    const userId = req.params.id;

    const { rows } = await fastifyInstance.db.query(
      'SELECT * FROM carts WHERE user_id=$1',
      [userId],
    );

    if (rows.length === 0) {
      // Return empty cart if none exists
      return {
        user_id: userId,
        items: [],
        created_at: null,
        updated_at: null,
      };
    }

    return rows[0];
  });
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
