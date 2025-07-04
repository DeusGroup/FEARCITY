const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}