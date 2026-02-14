import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import aiGenerationService from '../services/aiGenerationService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('generation');

const router = express.Router();

// Validation schemas
const queueGenerationSchema = z.object({
  type: z.enum(['image', '3d']).optional(),
  style: z.enum(['pixar', 'clay', 'cyber', 'line']).optional(),
  petName: z.string().min(1).max(50).optional(),
  customPrompt: z.string().max(500).optional(),
});

const checkStatusSchema = z.object({
  taskId: z.string().min(1),
});

// Queue a new AI generation task
router.post('/queue', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const validatedData = queueGenerationSchema.parse(req.body);

    const { type = 'image', style = 'pixar', petName = '', customPrompt = '' } = validatedData;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated. Please login again.',
      });
    }
    const petIpId = req.body.petIpId; // Optional: link to existing PetIP

    // Check user credits
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

    if (user.credits < 5) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits. You need at least 5 credits to generate.',
        credits: user.credits,
      });
    }

    // Build task data
    const taskData = {
      type,
      style,
      petName: petName || undefined,
      customPrompt: customPrompt || undefined,
      inputImage: req.body.inputImage || null, // Could be URL or base64
    };

    // Queue generation with ComfyUI
    const taskId = await aiGenerationService.queueGeneration(taskData);

    // Return task ID for client polling
    res.json({
      success: true,
      data: {
        taskId,
        message: 'Generation queued successfully',
        estimatedTime: '30-60 seconds',
      },
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    logger.error('Queue error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue generation',
    });
  }
});

// Check generation status
router.get('/status/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = checkStatusSchema.parse(req.params);

    // Check status from ComfyUI
    const statusData = await aiGenerationService.checkStatus(taskId);

    if (!statusData) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: statusData,
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    logger.error('Status check error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check generation status',
    });
  }
});

// Get generation history for current user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type; // '2d' or '3d'

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { userId };
    if (type) {
      where.type = type === '2d' ? 'image' : '3d';
    }

    // Get total count for pagination
    const total = await prisma.generation.count({ where });

    // Get generations with user relation
    const generations = await prisma.generation.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedGenerations = generations.map((gen) => ({
      id: gen.id,
      type: gen.type,
      status: gen.status,
      prompt: gen.prompt,
      cost: gen.cost,
      createdAt: gen.createdAt,
      completedAt: gen.completedAt,
      resultUrl: gen.resultUrl,
      model3dUrl: gen.resultData ? JSON.parse(gen.resultData || '{}').model3dUrl : null,
      error: gen.errorMessage,
    }));

    res.json({
      success: true,
      data: formattedGenerations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('History error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generation history',
    });
  }
});

// Cancel generation (optional)
router.delete('/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Note: Actual cancellation depends on ComfyUI API support
    // For now, we'll just mark it as failed in database
    const generation = await prisma.generation.findUnique({
      where: { id: taskId },
    });

    if (!generation || generation.userId !== req.userId) {
      return res.status(404).json({
        success: false,
        error: 'Generation not found or access denied',
      });
    }

    // Mark as failed/cancelled
    await prisma.generation.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        errorMessage: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Generation cancelled',
    });

  } catch (error) {
    logger.error('Cancel error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel generation',
    });
  }
});

export default router;
