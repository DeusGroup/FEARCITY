const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify Square webhook signature
const verifySquareWebhook = (req, res, next) => {
  try {
    const signature = req.get('x-square-signature');
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    if (!signature || !webhookSignatureKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
    }

    // Generate expected signature
    const requestBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha1', webhookSignatureKey)
      .update(requestBody, 'utf8')
      .digest('base64');

    // Compare signatures
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Webhook signature verification failed'
    });
  }
};

// POST /webhooks/square - Handle Square webhooks
router.post('/', verifySquareWebhook, async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log(`Received Square webhook: ${type}`);

    switch (type) {
      case 'payment.updated':
        await handlePaymentUpdated(data);
        break;
        
      case 'order.updated':
        await handleOrderUpdated(data);
        break;
        
      case 'refund.updated':
        await handleRefundUpdated(data);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error processing Square webhook:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process webhook'
    });
  }
});

// Handle payment updates
async function handlePaymentUpdated(data) {
  try {
    const payment = data.object.payment;
    const paymentId = payment.id;
    const status = payment.status;

    console.log(`Payment ${paymentId} status updated to: ${status}`);

    // Find order by Square payment ID
    const order = await prisma.order.findUnique({
      where: { squarePaymentId: paymentId }
    });

    if (!order) {
      console.warn(`No order found for payment ID: ${paymentId}`);
      return;
    }

    // Update order payment status
    let paymentStatus = 'PENDING';
    let orderStatus = order.status;

    switch (status) {
      case 'COMPLETED':
        paymentStatus = 'CAPTURED';
        if (order.status === 'PENDING') {
          orderStatus = 'CONFIRMED';
        }
        break;
      case 'FAILED':
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
        break;
      case 'CANCELED':
        paymentStatus = 'CANCELLED';
        orderStatus = 'CANCELLED';
        break;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        status: orderStatus,
        ...(status === 'COMPLETED' && { processedAt: new Date() })
      }
    });

    console.log(`Order ${order.orderNumber} updated: payment=${paymentStatus}, status=${orderStatus}`);

  } catch (error) {
    console.error('Error handling payment update:', error);
    throw error;
  }
}

// Handle order updates
async function handleOrderUpdated(data) {
  try {
    const squareOrder = data.object.order;
    const squareOrderId = squareOrder.id;

    console.log(`Square order ${squareOrderId} updated`);

    // Find order by Square order ID
    const order = await prisma.order.findUnique({
      where: { squareOrderId }
    });

    if (!order) {
      console.warn(`No order found for Square order ID: ${squareOrderId}`);
      return;
    }

    // Update order if needed based on Square order changes
    // This is a placeholder for any order-specific updates
    console.log(`Processing order update for ${order.orderNumber}`);

  } catch (error) {
    console.error('Error handling order update:', error);
    throw error;
  }
}

// Handle refund updates
async function handleRefundUpdated(data) {
  try {
    const refund = data.object.refund;
    const paymentId = refund.payment_id;
    const status = refund.status;
    const refundAmount = refund.amount_money.amount / 100; // Convert from cents

    console.log(`Refund for payment ${paymentId} status updated to: ${status}`);

    // Find order by Square payment ID
    const order = await prisma.order.findUnique({
      where: { squarePaymentId: paymentId }
    });

    if (!order) {
      console.warn(`No order found for payment ID: ${paymentId}`);
      return;
    }

    if (status === 'COMPLETED') {
      // Check if full or partial refund
      const orderTotal = parseFloat(order.totalAmount);
      const isFullRefund = Math.abs(refundAmount - orderTotal) < 0.01;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          status: isFullRefund ? 'REFUNDED' : order.status
        }
      });

      console.log(`Order ${order.orderNumber} refund completed: ${isFullRefund ? 'full' : 'partial'} refund of $${refundAmount}`);
    }

  } catch (error) {
    console.error('Error handling refund update:', error);
    throw error;
  }
}

module.exports = router;