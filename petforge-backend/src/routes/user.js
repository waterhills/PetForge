import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ============================================
// Validation Schemas
// ============================================

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(50, 'Name is too long').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number format').optional().nullable(),
  bio: z.string().max(200, 'Bio is too long (max 200 characters)').optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ============================================
// Multer Configuration for Avatar Upload
// ============================================

const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = req.user.userId;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for avatars
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
  },
});

// ============================================
// POST /api/user/avatar - Upload Avatar
// ============================================

router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No avatar file uploaded',
      });
    }

    const userId = req.user.userId;

    // Get current user to check for old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Build avatar URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    // Update user's avatar in database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        credits: true,
        updatedAt: true,
      },
    });

    // Delete old avatar file if it exists and is a local file
    if (currentUser?.avatar && currentUser.avatar.includes('/uploads/avatars/')) {
      const oldAvatarPath = path.join(
        __dirname,
        '../../uploads/avatars',
        path.basename(currentUser.avatar)
      );
      await fs.unlink(oldAvatarPath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }

    res.json({
      success: true,
      data: {
        user,
        avatarUrl,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
    });
  }
});

// ============================================
// PATCH /api/user/profile - Update Profile
// ============================================

router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    // Build update data - only include fields that are present
    const updateData = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
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
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// ============================================
// PATCH /api/user/password - Change Password
// ============================================

router.patch('/password', authenticateToken, async (req, res) => {
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

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
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

// ============================================
// GET /api/user/profile - Get User Profile (full)
// ============================================

router.get('/profile', authenticateToken, async (req, res) => {
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

export default router;
