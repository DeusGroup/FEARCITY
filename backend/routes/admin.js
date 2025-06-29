const express = require('express');
const { body, query, validationResult } = require('express-validator');
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

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockProducts,
      topProducts
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Total revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'CAPTURED' }
      }),
      
      // Total customers
      prisma.customer.count(),
      
      // Total products
      prisma.product.count({ where: { isActive: true } }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      
      // Low stock products
      prisma.product.findMany({
        where: {
          isActive: true,
          trackQuantity: true,
          quantity: { lte: prisma.product.fields.lowStockAlert }
        },
        take: 10,
        orderBy: { quantity: 'asc' }
      }),
      
      // Top selling products (last 30 days)
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        _count: { id: true },
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            status: { not: 'CANCELLED' }
          }
        },
        orderBy: {
          _sum: { quantity: 'desc' }
        },
        take: 10
      })
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(item => item.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, primaryImage: true, price: true }
    });

    const topProductsWithDetails = topProducts.map(item => {
      const product = topProductDetails.find(p => p.id === item.productId);
      return {
        ...product,
        totalSold: item._sum.quantity,
        orderCount: item._count.id
      };
    });

    res.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalCustomers,
        totalProducts
      },
      recentOrders,
      lowStockProducts,
      topProducts: topProductsWithDetails
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// GET /api/admin/orders - List orders with advanced filtering
router.get('/orders', [
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  query('paymentStatus').optional().isIn(['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  query('fulfillmentStatus').optional().isIn(['UNFULFILLED', 'PARTIAL', 'FULFILLED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['created', 'amount', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(fulfillmentStatus && { fulfillmentStatus }),
      ...(startDate && {
        createdAt: { gte: new Date(startDate) }
      }),
      ...(endDate && {
        createdAt: {
          ...where.createdAt,
          lte: new Date(endDate)
        }
      }),
      ...(minAmount && {
        totalAmount: { gte: parseFloat(minAmount) }
      }),
      ...(maxAmount && {
        totalAmount: {
          ...where.totalAmount,
          lte: parseFloat(maxAmount)
        }
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { customer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      })
    };

    const orderBy = {};
    if (sortBy === 'created') orderBy.createdAt = sortOrder;
    else if (sortBy === 'amount') orderBy.totalAmount = sortOrder;
    else if (sortBy === 'status') orderBy.status = sortOrder;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy,
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
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch orders'
    });
  }
});

// GET /api/admin/inventory - Inventory management
router.get('/inventory', [
  query('lowStock').optional().isBoolean(),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const {
      lowStock,
      category,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where = {
      isActive: true,
      ...(lowStock === 'true' && {
        trackQuantity: true,
        quantity: { lte: prisma.product.fields.lowStockAlert }
      }),
      ...(category && {
        category: { slug: category }
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: [
          { quantity: 'asc' },
          { name: 'asc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch inventory'
    });
  }
});

// PUT /api/admin/inventory/:productId - Update product inventory
router.put('/inventory/:productId', [
  body('quantity').isInt({ min: 0 }),
  body('lowStockAlert').optional().isInt({ min: 0 }),
  body('trackQuantity').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, lowStockAlert, trackQuantity } = req.body;

    const updateData = { quantity };
    if (lowStockAlert !== undefined) updateData.lowStockAlert = lowStockAlert;
    if (trackQuantity !== undefined) updateData.trackQuantity = trackQuantity;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({ product });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product Not Found'
      });
    }

    console.error('Error updating inventory:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update inventory'
    });
  }
});

module.exports = router;