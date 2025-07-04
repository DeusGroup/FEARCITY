// Next.js API Route: /api/products/[slug]
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { slug } = req.query;

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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}