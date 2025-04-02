import db from '../plugins/custom/db.js';

export default async function (fastifyInstance, opts) {
  fastifyInstance.register(db, opts);

  const updateCartSchema = {
    tags: ['carts'],
    description: 'Update user cart',
    summary: 'Update user cart',
    body: {
      required: ['userId', 'items'],
      type: 'object',
      properties: {
        userId: { type: 'number' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: { type: 'number' },
              quantity: { type: 'number', minimum: 0 },
              price: { type: 'number' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  };

  fastifyInstance.put(
    '',
    { schema: updateCartSchema },
    async (request, _reply) => {
      try {
        const { userId, items } = request.body;

        // Check if cart exists for user
        const checkCartText = 'SELECT id, items FROM carts WHERE user_id = $1';
        const checkCartValues = [userId];
        const cartResult = await fastifyInstance.db.query(
          checkCartText,
          checkCartValues,
        );

        let cartId;
        let currentItems = [];

        if (cartResult.rows.length === 0) {
          // Create new cart if it doesn't exist
          const createCartText =
            'INSERT INTO carts(user_id, items) VALUES($1, $2) RETURNING id';
          const createCartValues = [userId, JSON.stringify([])];
          const newCart = await fastifyInstance.db.query(
            createCartText,
            createCartValues,
          );
          cartId = newCart.rows[0].id;
        } else {
          // Use existing cart
          const cart = cartResult.rows[0];
          cartId = cart.id;
          currentItems = cart.items || [];
        }

        // Process each update
        for (const update of items) {
          const { productId, quantity } = update;

          // Find the item in the cart
          const existingItemIndex = currentItems.findIndex(
            (i) => i.productId === productId,
          );

          if (existingItemIndex >= 0) {
            if (quantity === 0) {
              // Remove item if quantity is 0
              currentItems.splice(existingItemIndex, 1);
            } else {
              // Update quantity
              currentItems[existingItemIndex].quantity = quantity;
              // Update other fields if provided
              if (update.price)
                currentItems[existingItemIndex].price = update.price;
              if (update.name)
                currentItems[existingItemIndex].name = update.name;
            }
          } else if (quantity > 0) {
            // Add as new item if it doesn't exist and quantity > 0
            currentItems.push(update);
          }
        }

        // Update the cart
        const updateText =
          'UPDATE carts SET items = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
        const updateValues = [JSON.stringify(currentItems), cartId];
        const result = await fastifyInstance.db.query(updateText, updateValues);

        return result.rows[0];
      } catch (error) {
        request.log.error(error);
        throw fastifyInstance.httpErrors.internalServerError({
          error: 'Internal Server Error',
          message: error.message,
          requestId: request.id,
        });
      }
    },
  );
}

export const autoConfig = (fastifyInstance) => ({
  dbConfig: fastifyInstance.basicDBConfig,
});
