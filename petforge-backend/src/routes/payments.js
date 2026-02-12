import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['wechat', 'alipay', 'card'], {
    errorMap: () => ({ message: 'Payment method must be wechat, alipay, or card' }),
  }),
});

const confirmPaymentSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
});

// Generate unique transaction ID: PAY + timestamp + random 8 digits
function generateTransactionId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `PAY${timestamp}${random}`;
}

// POST /api/payments/create - Create a payment order (simulation)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = createPaymentSchema.parse(req.body);
    const { orderId, paymentMethod } = validatedData;

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This order does not belong to you.',
      });
    }

    // Check if order is already paid
    if (order.status === 'paid' || order.status === 'processing') {
      return res.status(400).json({
        success: false,
        error: 'Order has already been paid',
      });
    }

    // Check if a pending payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: 'pending',
      },
    });

    if (existingPayment) {
      return res.json({
        success: true,
        data: {
          paymentId: existingPayment.id,
          transactionId: existingPayment.transactionId,
          amount: existingPayment.amount,
          paymentMethod: existingPayment.paymentMethod,
          status: existingPayment.status,
          message: 'Payment order already exists. Please proceed with payment.',
        },
      });
    }

    // Generate unique transaction ID
    let transactionId;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      transactionId = generateTransactionId();
      const existingTransaction = await prisma.payment.findUnique({
        where: { transactionId },
      });
      if (!existingTransaction) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique transaction ID',
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        transactionId,
        amount: order.totalAmount,
        paymentMethod,
        status: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        orderNumber: order.orderNumber,
        message: 'Payment order created successfully. Please confirm payment to complete the transaction.',
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
    });
  }
});

// POST /api/payments/confirm - Confirm payment (simulation of successful payment)
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = confirmPaymentSchema.parse(req.body);
    const { transactionId } = validatedData;

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found',
      });
    }

    // Verify user owns this payment through the order
    if (payment.order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This payment does not belong to you.',
      });
    }

    // Check if payment is already completed
    if (payment.status === 'success') {
      return res.status(400).json({
        success: false,
        error: 'Payment has already been confirmed',
      });
    }

    if (payment.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: 'Payment has failed. Please create a new payment order.',
      });
    }

    // Update payment and order status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          paidAt: new Date(),
        },
      });

      // Update order status to paid
      const updatedOrder = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'paid',
          paymentMethod: payment.paymentMethod,
        },
      });

      // Award points for the purchase (1 point per 1 currency unit spent)
      const pointsEarned = Math.floor(payment.amount);
      if (pointsEarned > 0) {
        // Get current user balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        const newBalance = user.credits + pointsEarned;

        // Update user credits
        await tx.user.update({
          where: { id: userId },
          data: {
            credits: newBalance,
          },
        });

        // Create point transaction record
        await tx.pointTransaction.create({
          data: {
            userId,
            type: 'earn',
            amount: pointsEarned,
            balance: newBalance,
            description: `Points earned from order ${payment.order.orderNumber}`,
            orderId: payment.orderId,
          },
        });
      }

      return { payment: updatedPayment, order: updatedOrder };
    });

    res.json({
      success: true,
      data: {
        transactionId: result.payment.transactionId,
        amount: result.payment.amount,
        paymentMethod: result.payment.paymentMethod,
        status: result.payment.status,
        paidAt: result.payment.paidAt,
        orderStatus: result.order.status,
        orderNumber: result.order.orderNumber,
        pointsEarned: Math.floor(payment.amount),
        message: 'Payment confirmed successfully!',
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment',
    });
  }
});

// GET /api/payments/:transactionId - Get payment details
router.get('/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            items: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Verify user owns this payment
    if (payment.order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment details',
    });
  }
});

// GET /api/payments - Get user's payment history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all user's orders with their payments
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const orderIds = orders.map(order => order.id);

    const payments = await prisma.payment.findMany({
      where: {
        orderId: { in: orderIds },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment history',
    });
  }
});

export default router;
