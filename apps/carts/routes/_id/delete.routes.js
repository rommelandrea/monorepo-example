import db from '../../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const deleteUserCartSchema = {
    tags: ['carts'],
    description: 'Delete user cart by user ID',
    summary: 'Delete user cart',
    params: {
      required: ['id'],
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
    },
  };

  fastifyInstance.delete(
    '',
    { schema: deleteUserCartSchema },
    async (req, reply) => {
      const userId = req.params.id;

      // First check if the cart exists
      const checkResult = await fastifyInstance.db.query(
        'SELECT id FROM carts WHERE user_id=$1',
        [userId],
      );

      if (checkResult.rows.length === 0) {
        // No cart found to delete
        return reply.code(404).send({
          error: 'Not Found',
          message: `No cart found for user ID: ${userId}`,
        });
      }

      // Delete the cart
      const deleteResult = await fastifyInstance.db.query(
        'DELETE FROM carts WHERE user_id=$1 RETURNING *',
        [userId],
      );

      // Return the deleted cart with 200 OK status
      return reply.code(200).send({
        message: 'Cart successfully deleted',
        deleted_cart: deleteResult.rows[0],
      });
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
