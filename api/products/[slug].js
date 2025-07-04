// Vercel Serverless Function - Single Product by Slug
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
      // Extract slug from the URL path
      const slug = req.url.split('/').pop().replace('.js', '');

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
        message: 'Failed to fetch product',
        details: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};