import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalPetIPs, totalOrders, pendingOrders] = await Promise.all([
      prisma.user.count(),
      prisma.petIP.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
    ]);

    // Calculate total revenue from completed orders
    const completedOrders = await prisma.order.findMany({
      where: { status: 'completed' },
      select: { totalAmount: true },
    });

    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPetIPs,
        totalOrders,
        pendingOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            petIPs: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// Get all PetIPs
router.get('/petips', async (req, res) => {
  try {
    const petIPs = await prisma.petIP.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: petIPs,
    });
  } catch (error) {
    console.error('Get PetIPs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch PetIPs',
    });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
});

// Update order status
router.patch('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
    });
  }
});

export default router;
