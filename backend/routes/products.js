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

// GET /api/products - List all products with filtering
router.get('/', [
  query('category').optional().isString(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('search').optional().isString(),
  query('featured').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['name', 'price', 'created', 'featured']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      featured,
      page = 1,
      limit = 20,
      sortBy = 'created',
      sortOrder = 'desc'
    } = req.query;

    // Build filter conditions
    const where = {
      isActive: true,
      ...(category && {
        category: {
          slug: category
        }
      }),
      ...(minPrice && {
        price: {
          gte: parseFloat(minPrice)
        }
      }),
      ...(maxPrice && {
        price: {
          ...where.price,
          lte: parseFloat(maxPrice)
        }
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      }),
      ...(featured === 'true' && { isFeatured: true })
    };

    // Build sort conditions
    const orderBy = {};
    if (sortBy === 'name') orderBy.name = sortOrder;
    else if (sortBy === 'price') orderBy.price = sortOrder;
    else if (sortBy === 'featured') orderBy.isFeatured = 'desc';
    else orderBy.createdAt = sortOrder;

    // Execute query with pagination
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
        orderBy,
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
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch products'
    });
  }
});

// GET /api/products/:slug - Get single product by slug
router.get('/:slug', [
  param('slug').isString().isLength({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { 
        slug,
        isActive: true 
      },
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

    if (!product) {
      return res.status(404).json({
        error: 'Product Not Found',
        message: `Product with slug '${slug}' does not exist`
      });
    }

    res.json({ product });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch product'
    });
  }
});

// GET /api/products/:id/related - Get related products
router.get('/:id/related', [
  param('id').isString(),
  query('limit').optional().isInt({ min: 1, max: 10 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Get the current product to find related products
    const product = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, price: true, tags: true }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product Not Found'
      });
    }

    // Find related products (same category, similar price range, or matching tags)
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: id },
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          {
            price: {
              gte: product.price * 0.7,
              lte: product.price * 1.3
            }
          },
          {
            tags: {
              hasSome: product.tags
            }
          }
        ]
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      take: limit,
      orderBy: { isFeatured: 'desc' }
    });

    res.json({ products: relatedProducts });

  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch related products'
    });
  }
});

// POST /api/products - Create new product (Admin only - will add auth later)
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 255 }),
  body('slug').isString().isLength({ min: 1, max: 255 }),
  body('price').isNumeric().isFloat({ min: 0 }),
  body('categoryId').isString(),
  body('sku').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString(),
  body('shortDescription').optional().isString(),
  body('quantity').optional().isInt({ min: 0 }),
  body('images').optional().isArray(),
  body('specifications').optional().isObject(),
  body('features').optional().isArray(),
  body('tags').optional().isArray()
], handleValidationErrors, async (req, res) => {
  try {
    const productData = req.body;

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });

    if (existingSku) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product with this SKU already exists'
      });
    }

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug }
    });

    if (existingSlug) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product with this slug already exists'
      });
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        primaryImage: productData.images?.[0] || null
      },
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

    res.status(201).json({ product });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create product'
    });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', [
  param('id').isString(),
  body('name').optional().isString().isLength({ min: 1, max: 255 }),
  body('price').optional().isNumeric().isFloat({ min: 0 }),
  body('quantity').optional().isInt({ min: 0 }),
  body('description').optional().isString(),
  body('shortDescription').optional().isString(),
  body('images').optional().isArray(),
  body('specifications').optional().isObject(),
  body('features').optional().isArray(),
  body('tags').optional().isArray(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Update primary image if images array is provided
    if (updateData.images && updateData.images.length > 0) {
      updateData.primaryImage = updateData.images[0];
    }

    const product = await prisma.product.update({
      where: { id },
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

    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Soft delete product (Admin only)
router.delete('/:id', [
  param('id').isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Product Not Found'
      });
    }

    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete product'
    });
  }
});

module.exports = router;