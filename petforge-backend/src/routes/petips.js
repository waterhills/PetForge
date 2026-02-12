import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Create PetIP
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.userId;
  try {
    console.log('[PetIP] Create request body:', JSON.stringify(req.body));
    console.log('[PetIP] userId from token:', userId);

    const { name, style, originalImage, generatedImage, rarity = 'Common' } = req.body;

    if (!name || !style || !generatedImage) {
      console.log('[PetIP] Validation failed:', { name: !!name, style: !!style, generatedImage: !!generatedImage });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, style, generatedImage',
      });
    }

    // Build create data, only include originalImage if provided
    const createData = {
      user: {
        connect: {
          id: userId,
        },
      },
      name,
      style,
      generatedImage,
      rarity,
      isPublic: true,
      likes: 0,
    };

    // Only add originalImage if it exists
    if (originalImage) {
      createData.originalImage = originalImage;
    }

    const petIP = await prisma.petIP.create({
      data: createData,
    });

    res.status(201).json({
      success: true,
      data: petIP,
    });
  } catch (error) {
    console.error('Create PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PetIP',
    });
  }
});

// Get all PetIPs (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, style, rarity } = req.query;
    const currentUserId = req.userId;

    const where = {};
    // Handle 'current' userId by using authenticated user's ID
    if (userId) {
      if (userId === 'current') {
        if (!currentUserId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required to access your PetIPs',
          });
        }
        where.userId = currentUserId;
      } else {
        where.userId = userId;
      }
    }
    if (style) where.style = style;
    if (rarity) where.rarity = rarity;

    const [petIPs, total] = await Promise.all([
      prisma.petIP.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.petIP.count({ where }),
    ]);

    res.json({
      success: true,
      data: petIPs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get PetIPs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PetIPs',
    });
  }
});

// Get single PetIP
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const petIP = await prisma.petIP.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!petIP) {
      return res.status(404).json({
        success: false,
        error: 'PetIP not found',
      });
    }

    res.json({
      success: true,
      data: petIP,
    });
  } catch (error) {
    console.error('Get PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PetIP',
    });
  }
});

// Update PetIP
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, style, isPublic } = req.body;

    const petIP = await prisma.petIP.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(style && { style }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json({
      success: true,
      data: petIP,
    });
  } catch (error) {
    console.error('Update PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PetIP',
    });
  }
});

// Delete PetIP
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

// Like PetIP
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;

    const petIP = await prisma.petIP.update({
      where: { id },
      data: {
        likes: {
          increment: 1,
        },
      },
    });

    res.json({
      success: true,
      data: { likes: petIP.likes },
    });
  } catch (error) {
    console.error('Like PetIP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like PetIP',
    });
  }
});

export default router;
