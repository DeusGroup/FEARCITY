const express = require('express');
const { body, validationResult } = require('express-validator');
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

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', [
  body('email').isEmail(),
  body('firstName').optional().isString().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().isLength({ min: 1, max: 50 }),
  body('source').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, firstName, lastName, source = 'website' } = req.body;

    // Check if already subscribed
    const existingSubscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({
          error: 'Already Subscribed',
          message: 'This email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        const subscription = await prisma.newsletterSubscription.update({
          where: { email },
          data: {
            isActive: true,
            firstName,
            lastName,
            source
          }
        });

        return res.json({
          success: true,
          message: 'Newsletter subscription reactivated successfully',
          subscription: {
            id: subscription.id,
            email: subscription.email,
            firstName: subscription.firstName,
            lastName: subscription.lastName
          }
        });
      }
    }

    // Create new subscription
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email,
        firstName,
        lastName,
        source
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscription: {
        id: subscription.id,
        email: subscription.email,
        firstName: subscription.firstName,
        lastName: subscription.lastName
      }
    });

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to subscribe to newsletter'
    });
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
router.post('/unsubscribe', [
  body('email').isEmail()
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription Not Found',
        message: 'No subscription found for this email address'
      });
    }

    if (!subscription.isActive) {
      return res.json({
        success: true,
        message: 'Email is already unsubscribed'
      });
    }

    await prisma.newsletterSubscription.update({
      where: { email },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unsubscribe from newsletter'
    });
  }
});

module.exports = router;