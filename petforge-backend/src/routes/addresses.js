import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const addressSchema = z.object({
  receiverName: z.string().min(1, 'Receiver name is required').max(50, 'Receiver name is too long'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number format'),
  province: z.string().min(1, 'Province is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  detail: z.string().min(1, 'Detail address is required').max(200, 'Detail address is too long'),
  isDefault: z.boolean().optional().default(false),
});

const updateAddressSchema = z.object({
  receiverName: z.string().min(1, 'Receiver name is required').max(50, 'Receiver name is too long').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, 'Invalid phone number format').optional(),
  province: z.string().min(1, 'Province is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  district: z.string().min(1, 'District is required').optional(),
  detail: z.string().min(1, 'Detail address is required').max(200, 'Detail address is too long').optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/addresses - Get user's address list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get addresses',
    });
  }
});

// GET /api/addresses/:id - Get single address
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    // Verify user owns this address
    if (address.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get address',
    });
  }
});

// POST /api/addresses - Create new address
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = addressSchema.parse(req.body);
    const { receiverName, phone, province, city, district, detail, isDefault } = validatedData;

    // If setting as default, unset previous default
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Check if user has any existing addresses
    const existingCount = await prisma.address.count({
      where: { userId },
    });

    // If this is the first address, make it default automatically
    const shouldBeDefault = existingCount === 0 || isDefault;

    const address = await prisma.address.create({
      data: {
        userId,
        receiverName,
        phone,
        province,
        city,
        district,
        detail,
        isDefault: shouldBeDefault,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
      message: 'Address created successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create address',
    });
  }
});

// PUT /api/addresses/:id - Update address
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Validate request body
    const validatedData = updateAddressSchema.parse(req.body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    if (existingAddress.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // If setting as default, unset previous default
    if (validatedData.isDefault === true) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: address,
      message: 'Address updated successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update address',
    });
  }
});

// DELETE /api/addresses/:id - Delete address
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    if (existingAddress.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const wasDefault = existingAddress.isDefault;

    // Delete the address
    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was default, set the most recent address as default
    if (wasDefault) {
      const remainingAddress = await prisma.address.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (remainingAddress) {
        await prisma.address.update({
          where: { id: remainingAddress.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete address',
    });
  }
});

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found',
      });
    }

    if (existingAddress.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Use transaction to update default address
    await prisma.$transaction([
      // Unset previous default
      prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      }),
      // Set new default
      prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    const address = await prisma.address.findUnique({
      where: { id },
    });

    res.json({
      success: true,
      data: address,
      message: 'Default address updated successfully',
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set default address',
    });
  }
});

export default router;
