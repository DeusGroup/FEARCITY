const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// GET /api/cart/:customerId - Get customer's cart
router.get('/:customerId', [
  param('customerId').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                primaryImage: true,
                sku: true,
                quantity: true,
                trackQuantity: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      return res.json({
        cart: null,
        items: [],
        total: 0,
        itemCount: 0
      });
    }

    // Filter out inactive products and calculate totals
    const activeItems = cart.items.filter(item => item.product.isActive);
    const total = activeItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.price) * item.quantity);
    }, 0);
    const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      cart: {
        id: cart.id,
        customerId: cart.customerId,
        updatedAt: cart.updatedAt
      },
      items: activeItems,
      total,
      itemCount
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch cart'
    });
  }
});

// POST /api/cart/:customerId/items - Add item to cart
router.post('/:customerId/items', [
  param('customerId').isString(),
  body('productId').isString(),
  body('quantity').isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { productId, quantity } = req.body;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        isActive: true 
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product Not Found',
        message: 'The specified product does not exist or is not available'
      });
    }

    // Check inventory
    if (product.trackQuantity && product.quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient Inventory',
        message: `Not enough stock available. Available: ${product.quantity}, Requested: ${quantity}`
      });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { customerId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId }
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // Check inventory for new total quantity
      if (product.trackQuantity && product.quantity < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient Inventory',
          message: `Cannot add ${quantity} more items. Available: ${product.quantity}, Current in cart: ${existingItem.quantity}`
        });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              primaryImage: true,
              sku: true,
              quantity: true,
              trackQuantity: true
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              primaryImage: true,
              sku: true,
              quantity: true,
              trackQuantity: true
            }
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      item: cartItem
    });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add item to cart'
    });
  }
});

// PUT /api/cart/:customerId/items/:itemId - Update cart item quantity
router.put('/:customerId/items/:itemId', [
  param('customerId').isString(),
  param('itemId').isString(),
  body('quantity').isInt({ min: 0 })
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId, itemId } = req.params;
    const { quantity } = req.body;

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          customerId
        }
      },
      include: {
        product: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        error: 'Cart Item Not Found'
      });
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId }
      });

      return res.json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    // Check inventory
    if (cartItem.product.trackQuantity && cartItem.product.quantity < quantity) {
      return res.status(400).json({
        error: 'Insufficient Inventory',
        message: `Not enough stock available. Available: ${cartItem.product.quantity}, Requested: ${quantity}`
      });
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            primaryImage: true,
            sku: true,
            quantity: true,
            trackQuantity: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      item: updatedItem
    });

  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update cart item'
    });
  }
});

// DELETE /api/cart/:customerId/items/:itemId - Remove item from cart
router.delete('/:customerId/items/:itemId', [
  param('customerId').isString(),
  param('itemId').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId, itemId } = req.params;

    // Verify the item belongs to the customer's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          customerId
        }
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        error: 'Cart Item Not Found'
      });
    }

    await prisma.cartItem.delete({
      where: { id: itemId }
    });

    res.json({
      success: true,
      message: 'Item removed from cart'
    });

  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove cart item'
    });
  }
});

// DELETE /api/cart/:customerId - Clear entire cart
router.delete('/:customerId', [
  param('customerId').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { customerId } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { customerId }
    });

    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear cart'
    });
  }
});

module.exports = router;