const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `FC${timestamp}${random}`.toUpperCase();
};

// POST /api/orders - Create new order
router.post('/', [
  body('items').isArray().isLength({ min: 1 }),
  body('items.*.productId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('customer').isObject(),
  body('customer.email').isEmail(),
  body('customer.firstName').isString().notEmpty(),
  body('customer.lastName').isString().notEmpty(),
  body('customer.phone').optional().isString(),
  body('shippingAddress').isObject(),
  body('shippingAddress.address1').isString().notEmpty(),
  body('shippingAddress.city').isString().notEmpty(),
  body('shippingAddress.state').isString().notEmpty(),
  body('shippingAddress.zip').isString().notEmpty(),
  body('billingAddress').optional().isObject(),
  body('customerNotes').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { items, customer, shippingAddress, billingAddress, customerNotes } = req.body;

    // Validate products exist and get pricing
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        error: 'Invalid Products',
        message: 'One or more products are not available'
      });
    }

    // Check inventory
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product.trackQuantity && product.quantity < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient Inventory',
          message: `Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Find or create customer
    let dbCustomer = await prisma.customer.findUnique({
      where: { email: customer.email }
    });

    if (!dbCustomer) {
      dbCustomer = await prisma.customer.create({
        data: {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone
        }
      });
    }

    // Create shipping address
    const shippingAddr = await prisma.address.create({
      data: {
        type: 'shipping',
        firstName: shippingAddress.firstName || customer.firstName,
        lastName: shippingAddress.lastName || customer.lastName,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US',
        phone: shippingAddress.phone || customer.phone,
        customerId: dbCustomer.id
      }
    });

    // Create billing address (use shipping if not provided)
    let billingAddr = shippingAddr;
    if (billingAddress && billingAddress !== shippingAddress) {
      billingAddr = await prisma.address.create({
        data: {
          type: 'billing',
          firstName: billingAddress.firstName || customer.firstName,
          lastName: billingAddress.lastName || customer.lastName,
          address1: billingAddress.address1,
          address2: billingAddress.address2,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: billingAddress.country || 'US',
          phone: billingAddress.phone || customer.phone,
          customerId: dbCustomer.id
        }
      });
    }

    // Calculate pricing
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal,
        productName: product.name,
        productSku: product.sku,
        productImage: product.primaryImage
      };
    });

    // Calculate tax (NYC sales tax: 8.25%)
    const taxRate = 0.0825;
    const taxAmount = subtotal * taxRate;

    // Calculate shipping (free over $500, otherwise $50)
    const shippingAmount = subtotal >= 500 ? 0 : 50;

    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: dbCustomer.id,
        email: customer.email,
        phone: customer.phone,
        shippingAddressId: shippingAddr.id,
        billingAddressId: billingAddr.id,
        subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        customerNotes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryImage: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        shippingAddress: true,
        billingAddress: true
      }
    });

    // Update customer statistics
    await prisma.customer.update({
      where: { id: dbCustomer.id },
      data: {
        orderCount: { increment: 1 },
        lastOrderAt: new Date()
      }
    });

    res.status(201).json({ order });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create order'
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', [
  param('id').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryImage: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        shippingAddress: true,
        billingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order Not Found',
        message: 'The specified order does not exist'
      });
    }

    res.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch order'
    });
  }
});

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', [
  param('orderNumber').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryImage: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        shippingAddress: true,
        billingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order Not Found',
        message: 'The specified order number does not exist'
      });
    }

    res.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch order'
    });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin)
router.put('/:id/status', [
  param('id').isString(),
  body('status').isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  body('fulfillmentStatus').optional().isIn(['UNFULFILLED', 'PARTIAL', 'FULFILLED']),
  body('trackingNumber').optional().isString(),
  body('shippingCarrier').optional().isString(),
  body('notes').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fulfillmentStatus, trackingNumber, shippingCarrier, notes } = req.body;

    const updateData = { status };
    
    if (fulfillmentStatus) {
      updateData.fulfillmentStatus = fulfillmentStatus;
      if (fulfillmentStatus === 'FULFILLED') {
        updateData.fulfilledAt = new Date();
      }
    }
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (shippingCarrier) updateData.shippingCarrier = shippingCarrier;
    if (notes) updateData.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                primaryImage: true,
                sku: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    res.json({ order });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Order Not Found'
      });
    }

    console.error('Error updating order:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update order status'
    });
  }
});

// GET /api/orders - List orders (Admin) with filtering
router.get('/', [
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  query('paymentStatus').optional().isIn(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  query('customerId').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(customerId && { customerId }),
      ...(startDate && {
        createdAt: {
          gte: new Date(startDate)
        }
      }),
      ...(endDate && {
        createdAt: {
          ...where.createdAt,
          lte: new Date(endDate)
        }
      })
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch orders'
    });
  }
});

module.exports = router;