const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

// GET /api/customers/:id - Get customer profile
router.get('/:id', [
  param('id').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer Not Found'
      });
    }

    res.json({ customer });

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer'
    });
  }
});

// GET /api/customers/:id/orders - Get customer orders
router.get('/:id/orders', [
  param('id').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  primaryImage: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.order.count({
        where: { customerId: id }
      })
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
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch customer orders'
    });
  }
});

// PUT /api/customers/:id - Update customer profile
router.put('/:id', [
  param('id').isString(),
  body('firstName').optional().isString().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().isLength({ min: 1, max: 50 }),
  body('phone').optional().isString(),
  body('dateOfBirth').optional().isISO8601(),
  body('acceptsMarketing').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        addresses: true
      }
    });

    res.json({ customer });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Customer Not Found'
      });
    }

    console.error('Error updating customer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update customer'
    });
  }
});

module.exports = router;