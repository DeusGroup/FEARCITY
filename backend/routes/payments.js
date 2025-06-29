const express = require('express');
const { body, validationResult } = require('express-validator');
const { Client, Environment } = require('square');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

const { paymentsApi, ordersApi, customersApi } = squareClient;

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

// POST /api/payments/process - Process payment with Square
router.post('/process', [
  body('sourceId').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ min: 0.01 }),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('orderId').isString().notEmpty(),
  body('customerId').optional().isString(),
  body('billingAddress').optional().isObject(),
  body('shippingAddress').optional().isObject(),
  body('customerEmail').isEmail(),
  body('idempotencyKey').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      sourceId,
      amount,
      currency = 'USD',
      orderId,
      customerId,
      billingAddress,
      shippingAddress,
      customerEmail,
      idempotencyKey = uuidv4()
    } = req.body;

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order Not Found',
        message: 'The specified order does not exist'
      });
    }

    // Verify order amount matches
    const orderTotal = parseFloat(order.totalAmount);
    if (Math.abs(orderTotal - parseFloat(amount)) > 0.01) {
      return res.status(400).json({
        error: 'Amount Mismatch',
        message: 'Payment amount does not match order total'
      });
    }

    // Create Square order (if not already created)
    let squareOrderId = order.squareOrderId;
    
    if (!squareOrderId) {
      const squareOrderRequest = {
        idempotencyKey: uuidv4(),
        order: {
          locationId: process.env.SQUARE_LOCATION_ID,
          lineItems: order.items.map(item => ({
            name: item.productName,
            quantity: item.quantity.toString(),
            basePriceMoney: {
              amount: Math.round(parseFloat(item.price) * 100), // Convert to cents
              currency: currency
            }
          })),
          taxes: [{
            name: 'Sales Tax',
            percentage: '8.25', // NYC sales tax
            scope: 'ORDER'
          }]
        }
      };

      try {
        const { result: orderResult } = await ordersApi.createOrder(squareOrderRequest);
        squareOrderId = orderResult.order.id;
        
        // Update our order with Square order ID
        await prisma.order.update({
          where: { id: orderId },
          data: { squareOrderId }
        });
      } catch (error) {
        console.error('Error creating Square order:', error);
        return res.status(500).json({
          error: 'Payment Processing Error',
          message: 'Failed to create payment order'
        });
      }
    }

    // Create payment request
    const paymentRequest = {
      idempotencyKey,
      sourceId,
      amountMoney: {
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: currency
      },
      orderId: squareOrderId,
      ...(customerId && { customerId }),
      locationId: process.env.SQUARE_LOCATION_ID,
      note: `Fear City Cycles Order #${order.orderNumber}`,
      buyerEmailAddress: customerEmail,
      ...(billingAddress && {
        billingAddress: {
          addressLine1: billingAddress.address1,
          addressLine2: billingAddress.address2,
          locality: billingAddress.city,
          administrativeDistrictLevel1: billingAddress.state,
          postalCode: billingAddress.zip,
          country: billingAddress.country || 'US'
        }
      }),
      ...(shippingAddress && {
        shippingAddress: {
          addressLine1: shippingAddress.address1,
          addressLine2: shippingAddress.address2,
          locality: shippingAddress.city,
          administrativeDistrictLevel1: shippingAddress.state,
          postalCode: shippingAddress.zip,
          country: shippingAddress.country || 'US'
        }
      })
    };

    // Process payment with Square
    const { result: paymentResult } = await paymentsApi.createPayment(paymentRequest);
    
    // Update order with payment information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        squarePaymentId: paymentResult.payment.id,
        paymentStatus: paymentResult.payment.status === 'COMPLETED' ? 'CAPTURED' : 'PENDING',
        status: paymentResult.payment.status === 'COMPLETED' ? 'CONFIRMED' : 'PENDING',
        processedAt: paymentResult.payment.status === 'COMPLETED' ? new Date() : null
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update inventory if payment successful
    if (paymentResult.payment.status === 'COMPLETED') {
      for (const item of order.items) {
        if (item.product.trackQuantity) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      }
    }

    res.json({
      success: true,
      payment: {
        id: paymentResult.payment.id,
        status: paymentResult.payment.status,
        orderId: squareOrderId,
        receiptNumber: paymentResult.payment.receiptNumber,
        receiptUrl: paymentResult.payment.receiptUrl
      },
      order: updatedOrder
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Handle Square API errors
    if (error.errors) {
      const squareError = error.errors[0];
      return res.status(400).json({
        error: 'Payment Failed',
        message: squareError.detail || 'Payment could not be processed',
        code: squareError.code
      });
    }

    res.status(500).json({
      error: 'Payment Processing Error',
      message: 'An unexpected error occurred while processing payment'
    });
  }
});

// POST /api/payments/refund - Process refund
router.post('/refund', [
  body('paymentId').isString().notEmpty(),
  body('amount').optional().isNumeric().isFloat({ min: 0.01 }),
  body('reason').optional().isString(),
  body('idempotencyKey').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const {
      paymentId,
      amount,
      reason,
      idempotencyKey = uuidv4()
    } = req.body;

    // Find the order by Square payment ID
    const order = await prisma.order.findUnique({
      where: { squarePaymentId: paymentId }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Payment Not Found',
        message: 'The specified payment does not exist'
      });
    }

    // Create refund request
    const refundRequest = {
      idempotencyKey,
      paymentId,
      ...(amount && {
        amountMoney: {
          amount: Math.round(parseFloat(amount) * 100),
          currency: 'USD'
        }
      }),
      ...(reason && { reason })
    };

    const { result: refundResult } = await paymentsApi.refundPayment(refundRequest);

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        status: amount ? order.status : 'REFUNDED'
      }
    });

    res.json({
      success: true,
      refund: {
        id: refundResult.refund.id,
        status: refundResult.refund.status,
        amount: refundResult.refund.amountMoney
      }
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    
    if (error.errors) {
      const squareError = error.errors[0];
      return res.status(400).json({
        error: 'Refund Failed',
        message: squareError.detail || 'Refund could not be processed',
        code: squareError.code
      });
    }

    res.status(500).json({
      error: 'Refund Processing Error',
      message: 'An unexpected error occurred while processing refund'
    });
  }
});

// GET /api/payments/:paymentId - Get payment details
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { result } = await paymentsApi.getPayment(paymentId);

    res.json({ payment: result.payment });

  } catch (error) {
    console.error('Error fetching payment:', error);
    
    if (error.errors) {
      const squareError = error.errors[0];
      return res.status(404).json({
        error: 'Payment Not Found',
        message: squareError.detail || 'Payment not found'
      });
    }

    res.status(500).json({
      error: 'Error',
      message: 'Failed to fetch payment details'
    });
  }
});

// POST /api/payments/create-customer - Create Square customer
router.post('/create-customer', [
  body('email').isEmail(),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  body('phone').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { email, firstName, lastName, phone } = req.body;

    const customerRequest = {
      idempotencyKey: uuidv4(),
      givenName: firstName,
      familyName: lastName,
      emailAddress: email,
      ...(phone && { phoneNumber: phone })
    };

    const { result } = await customersApi.createCustomer(customerRequest);

    // Update customer in our database
    await prisma.customer.update({
      where: { email },
      data: {
        squareCustomerId: result.customer.id
      }
    });

    res.json({
      success: true,
      customerId: result.customer.id
    });

  } catch (error) {
    console.error('Error creating Square customer:', error);
    
    if (error.errors) {
      const squareError = error.errors[0];
      return res.status(400).json({
        error: 'Customer Creation Failed',
        message: squareError.detail || 'Could not create customer',
        code: squareError.code
      });
    }

    res.status(500).json({
      error: 'Error',
      message: 'Failed to create customer'
    });
  }
});

module.exports = router;