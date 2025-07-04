// Next.js API Route: /api/contact
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
        message: 'Failed to submit contact form'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}