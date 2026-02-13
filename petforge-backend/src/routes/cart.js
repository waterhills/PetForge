import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const addToCartSchema = z.object({
  petIpId: z.string().optional(),
  productType: z.string().min(1, 'Product type is required'),
  productName: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  size: z.string().optional(),
  baseStyle: z.string().optional(),
  quantity: z.number().int().min(1).optional().default(1),
});

// Get user's cart (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { petIp: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: cartItems,
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart',
    });
  }
});

// Add item to cart (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = addToCartSchema.parse(req.body);
    const {
      petIpId,
      productType,
      productName,
      price,
      size,
      baseStyle,
      quantity,
    } = validatedData;

    const cartItem = await prisma.cartItem.create({
      data: {
        userId,
        petIpId,
        productType,
        productName,
        price: parseFloat(price),
        size,
        baseStyle,
        quantity: parseInt(quantity),
      },
      include: { petIp: true },
    });

    res.status(201).json({
      success: true,
      data: cartItem,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to cart',
    });
  }
});

// Add item to cart (alternative endpoint, requires authentication)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate request body
    const validatedData = addToCartSchema.parse(req.body);
    const { petIpId, productType, productName, price, size, baseStyle, quantity } = validatedData;

    const cartItem = await prisma.cartItem.create({
      data: {
        userId,
        petIpId,
        productType,
        productName,
        price: parseFloat(price),
        size,
        baseStyle,
        quantity: parseInt(quantity),
      },
      include: { petIp: true },
    });

    res.status(201).json({
      success: true,
      data: cartItem,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    console.error('Add to cart (alternative) error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to cart',
    });
  }
});

// Remove item from cart (requires authentication)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { id } = req.query;
    const userId = req.user.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Cart item ID is required',
      });
    }

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    if (cartItem.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    await prisma.cartItem.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item',
    });
  }
});

// Update cart item quantity (requires authentication)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required',
      });
    }

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found',
      });
    }

    if (cartItem.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity: parseInt(quantity) },
      include: { petIp: true },
    });

    res.json({
      success: true,
      data: updatedCartItem,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update item',
    });
  }
});

// Clear all items from cart (requires authentication)
router.post('/clear', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
    });
  }
});

export default router;
