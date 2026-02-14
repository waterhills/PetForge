import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('orders');

const router = express.Router();

// Validation schemas
const createOrderSchema = z.object({
  receiverName: z.string().min(1, 'Receiver name is required'),
  receiverPhone: z.string().min(1, 'Receiver phone is required'),
  receiverAddress: z.string().min(1, 'Receiver address is required'),
  paymentMethod: z.enum(['wechat', 'alipay', 'card'], {
    errorMap: () => ({ message: 'Payment method must be wechat, alipay, or card' }),
  }),
  useCredits: z.boolean().optional().default(false),
  creditsToUse: z.number().int().min(0).optional(),
});

// Generate unique order number: PF + timestamp (YYMMDD) + random 6 digits
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PF${dateStr}${random}`;
}

// Validation schema for query parameters
const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Get user's orders (requires authentication) with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate query parameters
    const query = querySchema.parse(req.query);
    const { page, limit, status, startDate, endDate } = query;

    // Build filter conditions
    const where = { userId };

    // Add status filter if provided
    if (status) {
      const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      where.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    // Get paginated orders
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
});

// Get single order (requires authentication)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Verify user owns this order
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
    });
  }
});

// Create new order (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = createOrderSchema.parse(req.body);
    const {
      receiverName,
      receiverPhone,
      receiverAddress,
      paymentMethod,
      useCredits,
      creditsToUse,
    } = validatedData;

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { petIp: true },
      orderBy: { createdAt: 'desc' },
    });

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty. Please add items to your cart first.',
      });
    }

    // Get user's current credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate total amount
    let totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    let creditsDiscount = 0;
    let finalAmount = totalAmount;

    // Handle credits deduction if requested
    if (useCredits) {
      const creditsToDeduct = creditsToUse && creditsToUse > 0
        ? Math.min(creditsToUse, user.credits)
        : user.credits;

      // 1 credit = 0.01 currency (adjust conversion rate as needed)
      creditsDiscount = creditsToDeduct * 0.01;
      finalAmount = Math.max(0, totalAmount - creditsDiscount);

      // Update user credits
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: user.credits - creditsToDeduct,
        },
      });
    }

    // Generate unique order number
    let orderNumber;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      orderNumber = generateOrderNumber();
      const existingOrder = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate unique order number',
      });
    }

    // Create order with items using transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          totalAmount: finalAmount,
          receiverName,
          receiverPhone,
          receiverAddress,
          paymentMethod,
          status: 'pending',
          items: {
            create: cartItems.map((item) => ({
              productType: item.productType,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
              specifications: JSON.stringify({
                size: item.size,
                baseStyle: item.baseStyle,
                petIpId: item.petIpId,
              }),
            })),
          },
        },
        include: { items: true },
      });

      // Clear cart items
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      data: {
        ...order,
        orderSummary: {
          originalAmount: totalAmount,
          creditsDiscount,
          creditsUsed: useCredits ? (creditsToUse || user.credits) : 0,
          finalAmount,
        },
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
});

// Update order status (requires authentication)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    // Validate status enum
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (existingOrder.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
    });
  }
});

export default router;
