import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import comfyUIService from '../services/comfyUIService.js';

const router = express.Router();

// Validation schemas
const queueGenerationSchema = z.object({
  type: z.enum(['image', '3d']).optional(),
  style: z.enum(['pixar', 'clay', 'cyber', 'line']).optional(),
  petName: z.string().min(1).max(50).optional(),
  customPrompt: z.string().max(500).optional(),
  inputImage: z.string().optional(),
});

const checkStatusSchema = z.object({
  taskId: z.string().min(1),
});

// Queue a new AI generation task with REAL ComfyUI
router.post('/queue-comfyui', authenticateToken, async (req, res) => {
  try {
    console.log('[ComfyUI] Generation request received');

    // Validate request body
    const validatedData = queueGenerationSchema.parse(req.body);
    const { type = 'image', style = 'pixar', petName = '', customPrompt = '', inputImage } = validatedData;
    const userId = req.userId;

    // Debug: log auth info
    console.log('[ComfyUI] Auth info:', {
      hasUser: !!req.user,
      userId,
      userEmail: req.user?.email
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated. Please login again.',
      });
    }

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

    const requiredCredits = type === '3d' ? 10 : 5;

    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        error: `Insufficient credits. You need at least ${requiredCredits} credits to generate.`,
        credits: user.credits,
        required: requiredCredits,
      });
    }

    console.log('[ComfyUI] User has sufficient credits:', user.credits);

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: type === '3d' ? '3d' : '2d',
        status: 'pending',
        prompt: JSON.stringify(validatedData),
        inputImage: inputImage || null,
        cost: requiredCredits,
      },
    });

    const taskId = generation.id;
    console.log('[ComfyUI] Created generation record:', taskId);

    // Queue generation with ComfyUI
    try {
      const comfyTaskId = await comfyUIService.queueGeneration({
        type,
        style,
        petName,
        customPrompt,
        inputImage,
      });

      console.log('[ComfyUI] ComfyUI task queued:', comfyTaskId);

      // Store ComfyUI prompt_id in resultData for status lookup
      await prisma.generation.update({
        where: { id: taskId },
        data: {
          resultData: JSON.stringify({ comfyTaskId }),
        },
      });

      // Return task ID for client polling (return database ID, not ComfyUI ID)
      res.json({
        success: true,
        data: {
          taskId: taskId, // Return database ID for status polling
          comfyTaskId: comfyTaskId, // ComfyUI internal ID for reference
          message: 'Generation queued successfully',
          estimatedTime: '15-30 seconds',
          backend: 'comfyui',
        },
      });

    } catch (comfyError) {
      // ComfyUI失败，回滚数据库记录
      console.error('[ComfyUI] ComfyUI error:', comfyError);

      await prisma.generation.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: comfyError.message,
        },
      });

      res.status(500).json({
        success: false,
        error: `ComfyUI error: ${comfyError.message}`,
      });
    }

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    console.error('[ComfyUI] Queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to queue generation',
    });
  }
});

// Check generation status from ComfyUI
router.get('/status-comfyui/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = checkStatusSchema.parse(req.params);
    const userId = req.userId;

    console.log('[ComfyUI] Status check for task:', taskId);

    // Get generation from database to verify ownership
    const generation = await prisma.generation.findUnique({
      where: { id: taskId },
    });

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Check ownership
    if (generation.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Extract ComfyUI prompt_id from resultData
    let comfyTaskId = taskId;
    if (generation.resultData) {
      try {
        const resultData = JSON.parse(generation.resultData);
        comfyTaskId = resultData.comfyTaskId || taskId;
      } catch (e) {
        console.log('[ComfyUI] Could not parse resultData, using taskId');
      }
    }

    console.log('[ComfyUI] Checking ComfyUI status for:', comfyTaskId);

    // Check status from ComfyUI
    const statusData = await comfyUIService.checkStatus(comfyTaskId);

    // Update generation record if completed
    if (statusData.status === 'completed' && generation.status !== 'completed') {
      const cost = generation.cost;

      // Update generation record
      await prisma.generation.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          resultUrl: statusData.resultUrl,
          completedAt: new Date(),
        },
      });

      // Deduct user credits
      await prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: cost,
          },
        },
      });

      console.log('[ComfyUI] Generation completed, credits deducted:', cost);
    } else if (statusData.status === 'failed') {
      // Mark as failed in database
      await prisma.generation.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: statusData.error || 'Generation failed',
          completedAt: new Date(),
        },
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

    console.error('[ComfyUI] Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check generation status',
    });
  }
});

// Get generation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { userId };
    if (type) {
      where.type = type === '2d' ? 'image' : '3d';
    }

    // Get total count
    const total = await prisma.generation.count({ where });

    // Get generations
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
      errorMessage: gen.errorMessage,
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
    console.error('[ComfyUI] History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generation history',
    });
  }
});

// Cancel generation
router.delete('/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    const generation = await prisma.generation.findUnique({
      where: { id: taskId },
    });

    if (!generation || generation.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Generation not found or access denied',
      });
    }

    // Try to cancel in ComfyUI (if API supports it)
    // For now, just mark as failed in database
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
    console.error('[ComfyUI] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel generation',
    });
  }
});

export default router;
