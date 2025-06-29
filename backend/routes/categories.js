const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/categories - List all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch categories'
    });
  }
});

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await prisma.category.findUnique({
      where: { 
        slug,
        isActive: true 
      },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { isFeatured: 'desc' }
        },
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        error: 'Category Not Found',
        message: `Category with slug '${slug}' does not exist`
      });
    }

    res.json({ category });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch category'
    });
  }
});

module.exports = router;