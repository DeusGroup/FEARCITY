const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const router = express.Router();
const prisma = new PrismaClient();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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

// POST /api/contact - Submit contact form
router.post('/', [
  body('firstName').isString().isLength({ min: 1, max: 50 }),
  body('lastName').isString().isLength({ min: 1, max: 50 }),
  body('email').isEmail(),
  body('phone').optional().isString(),
  body('company').optional().isString().isLength({ max: 100 }),
  body('type').isIn(['GENERAL', 'CUSTOM_BUILD', 'PARTS_INQUIRY', 'SERVICE', 'WHOLESALE', 'PRESS']),
  body('subject').optional().isString().isLength({ max: 200 }),
  body('message').isString().isLength({ min: 10, max: 2000 }),
  body('buildDetails').optional().isObject(),
  body('budget').optional().isString(),
  body('timeline').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      type,
      subject,
      message,
      buildDetails,
      budget,
      timeline
    } = req.body;

    // Create contact submission in database
    const submission = await prisma.contactSubmission.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        type,
        subject,
        message,
        buildDetails,
        budget,
        timeline
      }
    });

    // Send notification email to admin
    const adminEmailSubject = `New ${type.replace('_', ' ')} Inquiry from ${firstName} ${lastName}`;
    const adminEmailBody = `
      New contact form submission received:
      
      Name: ${firstName} ${lastName}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Company: ${company || 'Not provided'}
      Type: ${type}
      Subject: ${subject || 'Not provided'}
      
      Message:
      ${message}
      
      ${buildDetails ? `Build Details: ${JSON.stringify(buildDetails, null, 2)}` : ''}
      ${budget ? `Budget: ${budget}` : ''}
      ${timeline ? `Timeline: ${timeline}` : ''}
      
      Submission ID: ${submission.id}
      Submitted: ${new Date().toLocaleString()}
    `;

    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: adminEmailSubject,
        text: adminEmailBody
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    const customerEmailSubject = 'Thank you for contacting Fear City Cycles';
    const customerEmailBody = `
      Dear ${firstName},
      
      Thank you for reaching out to Fear City Cycles. We've received your ${type.replace('_', ' ').toLowerCase()} inquiry and will get back to you within 24 hours.
      
      Your inquiry details:
      - Type: ${type.replace('_', ' ')}
      - Subject: ${subject || 'General inquiry'}
      - Submission ID: ${submission.id}
      
      If you need immediate assistance, you can call us at (718) 555-0123.
      
      Ride or Die,
      Fear City Cycles Team
      Queens, NYC
    `;

    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: customerEmailSubject,
        text: customerEmailBody
      });
    } catch (emailError) {
      console.error('Failed to send customer confirmation:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit contact form. Please try again later.'
    });
  }
});

// GET /api/contact/submissions - List contact submissions (Admin)
router.get('/submissions', async (req, res) => {
  try {
    const {
      status,
      type,
      page = 1,
      limit = 20
    } = req.query;

    const where = {
      ...(status && { status }),
      ...(type && { type })
    };

    const [submissions, totalCount] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.contactSubmission.count({ where })
    ]);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch contact submissions'
    });
  }
});

// PUT /api/contact/submissions/:id - Update submission status (Admin)
router.put('/submissions/:id', [
  body('status').isIn(['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED']),
  body('adminNotes').optional().isString(),
  body('assignedTo').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedTo } = req.body;

    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'RESPONDED') updateData.respondedAt = new Date();

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: updateData
    });

    res.json({ submission });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Submission Not Found'
      });
    }

    console.error('Error updating contact submission:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update contact submission'
    });
  }
});

module.exports = router;