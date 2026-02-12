import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schema for query parameters
const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.enum(['earn', 'spend', 'refund', 'admin_add', 'admin_deduct']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/points - Get user's points balance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get statistics
    const stats = await prisma.pointTransaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get earned points (positive amounts)
    const earnedStats = await prisma.pointTransaction.aggregate({
      where: {
        userId,
        amount: { gt: 0 },
      },
      _sum: {
        amount: true,
      },
    });

    // Get spent points (negative amounts)
    const spentStats = await prisma.pointTransaction.aggregate({
      where: {
        userId,
        amount: { lt: 0 },
      },
      _sum: {
        amount: true,
      },
    });

    res.json({
      success: true,
      data: {
        balance: user.credits,
        totalEarned: earnedStats._sum.amount || 0,
        totalSpent: Math.abs(spentStats._sum.amount || 0),
        transactionCount: stats._count.id || 0,
      },
    });
  } catch (error) {
    console.error('Get points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points balance',
    });
  }
});

// GET /api/points/history - Get user's points transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate query parameters
    const query = historyQuerySchema.parse(req.query);
    const { page, limit, type, startDate, endDate } = query;

    // Build filter conditions
    const where = { userId };

    // Add type filter if provided
    if (type) {
      where.type = type;
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
    const total = await prisma.pointTransaction.count({ where });

    // Get paginated transactions
    const transactions = await prisma.pointTransaction.findMany({
      where,
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
      data: transactions,
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
    console.error('Get points history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points history',
    });
  }
});

// GET /api/points/summary - Get points summary by type
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get summary grouped by type
    const summaryByType = await prisma.pointTransaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get recent transactions (last 5)
    const recentTransactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Format summary
    const summary = {
      earn: { amount: 0, count: 0 },
      spend: { amount: 0, count: 0 },
      refund: { amount: 0, count: 0 },
      admin_add: { amount: 0, count: 0 },
      admin_deduct: { amount: 0, count: 0 },
    };

    summaryByType.forEach((item) => {
      summary[item.type] = {
        amount: item._sum.amount || 0,
        count: item._count.id,
      };
    });

    res.json({
      success: true,
      data: {
        summary,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('Get points summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get points summary',
    });
  }
});

export default router;
