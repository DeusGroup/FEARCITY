// Vercel Serverless Function - Contact Form
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

  if (req.method === 'POST') {
    try {
      const {
        type,
        firstName,
        lastName,
        email,
        phone,
        message,
        buildType,
        budget,
        product,
        size,
        organization,
        deadline,
        source = 'website'
      } = req.body;

      // Basic validation
      if (!email || !message) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Email and message are required'
        });
      }

      // Create contact submission
      const submission = await prisma.contactSubmission.create({
        data: {
          type: type || 'GENERAL',
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          phone: phone || '',
          message,
          buildType,
          budget,
          product,
          size,
          organization,
          deadline,
          source,
          isRead: false
        }
      });

      res.json({
        success: true,
        message: 'Contact form submitted successfully',
        submissionId: submission.id
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to submit contact form',
        details: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};