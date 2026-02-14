import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get dashboard stats - requires admin.view-stats permission
router.get('/stats', authMiddleware, requirePermission('admin.view-stats'), async (req, res) => {
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

// Admin dashboard - requires admin.view-stats permission
router.get('/dashboard', authMiddleware, requirePermission('admin.view-stats'), async (req, res) => {
  try {
    // 获取概览统计数据
    const [totalUsers, totalPetIPs, totalOrders] = await Promise.all([
      prisma.user.count(),
      prisma.petIP.count(),
      prisma.order.count()
    ]);

    // 获取最近活动
    const recentActivity = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          credits: true,
          createdAt: true
        }
      });

      const petIPs = await tx.petIP.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      const orders = await tx.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      return {
        users,
        petIPs,
        orders
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalPetIPs,
          totalOrders
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Get all users - requires users.view permission
router.get('/users', authMiddleware, requirePermission('users.view'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        credits: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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

// Get user by ID - requires users.view permission
router.get('/users/:id', authMiddleware, requirePermission('users.view'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        credits: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        createdAt: true,
        _count: {
          select: {
            orders: true,
            petIPs: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Calculate total spent from completed orders
    const orders = await prisma.order.findMany({
      where: {
        userId: id,
        status: 'completed',
      },
      select: {
        totalAmount: true,
      },
    });

    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      data: {
        ...user,
        totalSpent,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

// Get all PetIPs - requires petips.view permission
router.get('/petips', authMiddleware, requirePermission('petips.view'), async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};

    const petIPs = await prisma.petIP.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        style: true,
        rarity: true,
        likes: true,
        isPublic: true,
        createdAt: true,
        userId: true,
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

// Get all orders - requires orders.view permission
router.get('/orders', authMiddleware, requirePermission('orders.view'), async (req, res) => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId } : {};

    const orders = await prisma.order.findMany({
      where,
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

// Update order status - requires orders.update-status permission
router.patch('/orders/:id', authMiddleware, requirePermission('orders.update-status'), async (req, res) => {
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

// Create new PetIP - requires petips.create permission
router.post('/petips', authMiddleware, requirePermission('petips.create'), async (req, res) => {
  try {
    const { name, style, rarity, userId } = req.body;

    // Validation
    if (!name || !style || !rarity || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Name, style, rarity, and userId are required',
      });
    }

    const petIP = await prisma.petIP.create({
      data: {
        name,
        style,
        rarity,
        isPublic: false,
        userId,
        likes: 0,
      },
    });

    // Fetch user relation
    const petIPWithUser = await prisma.petIP.findUnique({
      where: { id: petIP.id },
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
      data: petIPWithUser,
    });
  } catch (error) {
    console.error('Create PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PetIP',
    });
  }
});

// Update PetIP - requires petips.edit permission
router.put('/petips/:id', authMiddleware, requirePermission('petips.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, style, rarity, isPublic } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const petIP = await prisma.petIP.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(style && { style }),
        ...(rarity && { rarity }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    // Fetch user relation
    const petIPWithUser = await prisma.petIP.findUnique({
      where: { id },
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
      data: petIPWithUser,
    });
  } catch (error) {
    console.error('Update PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PetIP',
    });
  }
});

// Delete PetIP - requires petips.delete permission
router.delete('/petips/:id', authMiddleware, requirePermission('petips.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if PetIP exists
    const petIP = await prisma.petIP.findUnique({
      where: { id },
    });

    if (!petIP) {
      return res.status(404).json({
        success: false,
        error: 'PetIP not found',
      });
    }

    // Delete PetIP
    await prisma.petIP.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'PetIP deleted successfully',
    });
  } catch (error) {
    console.error('Delete PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete PetIP',
    });
  }
});

// Create new Order - requires orders.create permission
router.post('/orders', authMiddleware, requirePermission('orders.create'), async (req, res) => {
  try {
    const {
      userId,
      items,
      receiverName,
      receiverPhone,
      receiverAddress,
      paymentMethod,
      totalAmount
    } = req.body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        status: 'pending',
        paymentMethod,
        receiverName,
        receiverPhone,
        receiverAddress,
        items: {
          create: items.map(item => ({
            productType: item.productType,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            baseStyle: item.baseStyle,
          }))
        },
      },
    });

    // Fetch user and items relations
    const orderWithRelations = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        items: true,
      },
    });

    res.json({
      success: true,
      data: orderWithRelations,
    });
  } catch (error) {
    console.error('Create Order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
});

// Delete Order - requires orders.delete permission
router.delete('/orders/:id', authMiddleware, requirePermission('orders.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Delete order items first (foreign key constraint)
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Delete order
    await prisma.order.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete Order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order',
    });
  }
});

export default router;
