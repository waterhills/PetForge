import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(50, 'Name is too long').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number format').optional().nullable(),
  avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
  bio: z.string().max(200, 'Bio is too long (max 200 characters)').optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default 'user' role
    const defaultRole = await prisma.role.findUnique({
      where: { name: 'user' },
    });

    // Create user with initial credits and default role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        credits: 100, // Initial credits for new users
        roleId: defaultRole?.id, // Assign default role
      },
    });

    // Generate token with role info
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleName: defaultRole?.name || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set httpOnly cookie for security
    res.cookie('auth_token', token, {
      httpOnly: true, // 防止 JS 读取 cookie（XSS 防护）
      secure: process.env.NODE_ENV === 'production', // 生产环境强制 HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 开发环境用 lax 兼容跨端口
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          credits: user.credits,
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
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        avatar: true,
        credits: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate token with role info
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleName: user.role?.name || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set httpOnly cookie for security
    res.cookie('auth_token', token, {
      httpOnly: true, // 防止 JS 读取 cookie（XSS 防护）
      secure: process.env.NODE_ENV === 'production', // 生产环境强制 HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // 开发环境用 lax 兼容跨端口
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          credits: user.credits,
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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({
          success: false,
          error: 'Invalid token',
        });
      }
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  }
});

// GET /api/user/profile - Get user profile (authenticated)
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            petIPs: true,
            addresses: true,
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

    // Get order statistics
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        id: true,
      },
    });

    // Format order stats
    const orderStatusCounts = {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orderStats.forEach((stat) => {
      orderStatusCounts[stat.status] = stat._count.id;
    });

    res.json({
      success: true,
      data: {
        ...user,
        orderStats: orderStatusCounts,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
});

// PUT /api/user/profile - Update user profile (authenticated)
router.put('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    // Remove undefined values
    const updateData = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.avatar !== undefined) updateData.avatar = validatedData.avatar;
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
});

// PUT /api/user/password - Change user password (authenticated)
router.put('/user/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);
    const { currentPassword, newPassword } = validatedData;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user has a password set (might be OAuth user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change password for OAuth accounts',
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

export default router;
