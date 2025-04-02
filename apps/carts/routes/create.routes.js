import camelcaseKey from 'camelcase-keys';
import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const addCartItemSchema = {
    tags: ['carts'],
    description: 'Add item to user cart',
    summary: 'Add item to user cart',
    body: {
      required: ['userId', 'item'],
      type: 'object',
      properties: {
        userId: { type: 'number', minimum: 1 },
        item: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'number' },
            quantity: { type: 'number', minimum: 1 },
            price: { type: 'number' },
            name: { type: 'string' },
          },
        },
      },
    },
    response: {
      200: {
        description: 'Item added to cart successfully',
        type: 'object',
        properties: {
          id: { type: 'number' },
          userId: { type: 'number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'number' },
                quantity: { type: 'number' },
                price: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      400: {
        description: 'Invalid request data',
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
          message: { type: 'string' },
          requestId: { type: 'string' },
        },
      },
    },
  };
  fastifyInstance.post(
    '',
    { schema: addCartItemSchema },
    async (request, reply) => {
      try {
        const { userId, item } = request.body;

        // Check if cart exists for user
        const checkCartText = 'SELECT id, items FROM carts WHERE user_id = $1';
        const checkCartValues = [userId];
        const cartResult = await fastifyInstance.db.query(
          checkCartText,
          checkCartValues,
        );

        let result;

        if (cartResult.rows.length === 0) {
          // Create new cart with item
          const insertText =
            'INSERT INTO carts(user_id, items) VALUES($1, $2) RETURNING *';
          const insertValues = [userId, JSON.stringify([item])];
          result = await fastifyInstance.db.query(insertText, insertValues);
        } else {
          // Update existing cart
          const cart = cartResult.rows[0];
          const cartId = cart.id;
          const currentItems = cart.items || [];

          // Check if product already exists in cart
          const existingItemIndex = currentItems.findIndex(
            (i) => i.productId === item.productId,
          );

          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            currentItems[existingItemIndex].quantity += item.quantity;
          } else {
            // Add new item to cart
            currentItems.push(item);
          }

          const updateText =
            'UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
          const updateValues = [JSON.stringify(currentItems), cartId];
          result = await fastifyInstance.db.query(updateText, updateValues);
        }

        return camelcaseKey(result.rows[0]);
      } catch (error) {
        // Handle error
        reply.code(500);
        request.log.error(error);
        return {
          error: 'Internal Server Error',
          message: 'An error occurred while adding item to cart',
          requestId: request.id,
        };
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
