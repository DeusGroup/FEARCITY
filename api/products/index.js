// Vercel Serverless Function - Products API
const { PrismaClient } = require('@prisma/client');

let prisma;

// Initialize Prisma with connection pooling for serverless
if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        message: 'Failed to fetch products',
        details: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};