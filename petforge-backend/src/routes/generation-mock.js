import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

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

// Mock generation function (simulates ComfyUI)
async function simulateGeneration(taskId, userId, taskData) {
  console.log('[Mock Generation] Starting simulation for task:', taskId);

  const { type = 'image', style = 'pixar' } = taskData;

  // Simulate processing time (3-10 seconds)
  const processingTime = 3000 + Math.random() * 7000;

  // Wait for "generation"
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Generate mock result URLs based on type
  let resultUrl;
  if (type === '3d') {
    // Mock 3D model result
    resultUrl = `https://via.placeholder.com/512?text=3D+Model+${style}`;
  } else {
    // Mock 2D image result - use different style-based placeholders
    const styleImages = {
      'pixar': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Sa8qqFmL0M66DCtFnIEqEn8VgR9go5iUeFye7xfD0xoA6i_lrwoD2kz6ApKEcv-SqFgdfM3WVF8EKj3IQSZzkKQm3AXTDMrX_O9r9wyJ75KZhf332CDQQzNRes30YyuPqtXjyLP9q2AorxJJPnKk87oB3eHf_eMEONhAKXEDOOMLhjedCqImRAPfrJ-JSBSzcz_wRkjBIH8sSNZBsvCksoQo8uiZhrO8fUNOpo1WI3LSFmxLbNuAxozOoN_2Z28sNL00-mXgY1Jw',
      'clay': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhOEonJyjMgn5ZMDofXY8R8Lm5Z6LbOvaUeQllzDpcDSxWF31wovApu3h3Jyd4t1YPVZNtV83kHvKoywfgw-RZId-CXwO8XHnKEHlbrNL5nCqFafUGPC4VRvhnTs1TJ0wuxdbbA96i-4-ccIJL5sf44Kb3Qw7w_auxyShOLSUlzprxr6C6pCCzjmgV5zdX4q6u5dQEYgodfNTLv756QwAwwh12xAMIJ9yJokp8z9UwES2VnRg7cI39ACrqRZCpsmb1m4jAvR8v7ss',
      'cyber': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRh308zlJaHuXA8Uq64LC_rcZ-rfnxBqoKqCgzT3tZ9euRmUR6JRabWcdrGRlEhuLZ6zBGYEdYMN0-4NP2sGam5IeOhs1v-7zIqrjcmiShNpXUNxqU-Q0lVukatoUUAYwOWvjwLkKkWvlrOKiwCpBVFetshlgfzTMG1rCz3fOXOxVj3WoeUC_DBCdpSj8RMBXtB2JwfU7myR_Jflf5mIguQXkDhIg3jfFIvxGOyVGP_GVgb-JklPRqHrV6n8CB9NMcVrfF2XVpN2Q',
      'line': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9BAmu55ppPMoqZqsdKsTvSGpMAO4yFRAORLZN2q_YB_sTJaQKxl4ahkCYVmPvFkYb6VD8EgnnQqm9JHrliVS0pBxcTLxbuiEq9nfEpwcx-mMLIAx3f4c0816hvTgGRi50kRDvp4wWTO5h7FINB4D4AteJ9W7_AgcFd1lkk0TWMkEIvFZDxWd0pjpZX3p2NA4Auu_2JKij11kyTzHd3dBlfjbuG7z7uqyqZr-23_GtCxYA-y1JMl_gwH8j-RcLJKcsweZ2WVlhPdM',
    };

    resultUrl = styleImages[style] || styleImages.pixar;
  }

  // Update generation record
  await prisma.generation.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      resultUrl,
      completedAt: new Date(),
    },
  });

  // Deduct credits
  const cost = type === '3d' ? 10 : 5;
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: cost },
    },
  });

  console.log('[Mock Generation] Completed for task:', taskId);

  return { resultUrl, type };
}

// Queue a new AI generation task
router.post('/queue', authenticateToken, async (req, res) => {
  try {
    // Validate request body
    const validatedData = queueGenerationSchema.parse(req.body);
    const { type = 'image', style = 'pixar', petName = '', customPrompt = '' } = validatedData;
    const userId = req.userId;

    console.log('[Mock Generation] Queue request received:', { userId, type, style, petName });

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

    // Create pending generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        type: type === '3d' ? '3d' : '2d',
        status: 'pending',
        prompt: JSON.stringify(validatedData),
        inputImage: req.body.inputImage || null,
        cost: requiredCredits,
      },
    });

    const taskId = generation.id;

    console.log('[Mock Generation] Created pending generation:', taskId);

    // Start background simulation (don't await)
    simulateGeneration(taskId, userId, { type, style, petName, customPrompt }).catch(err => {
      console.error('[Mock Generation] Simulation error:', err);
    });

    // Return task ID immediately
    res.json({
      success: true,
      data: {
        taskId,
        message: 'Generation queued successfully (mock mode)',
        estimatedTime: '3-10 seconds',
        mockMode: true, // Flag to indicate this is mock mode
      },
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    console.error('[Mock Generation API] Queue error:', error);
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

    // Get generation from database
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
    if (generation.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Return status
    const result = {
      status: generation.status, // pending, processing, completed, failed
      taskId: generation.id,
      progress: generation.status === 'completed' ? 100 : (generation.status === 'pending' ? 0 : 50),
      resultUrl: generation.resultUrl,
      error: generation.errorMessage,
      type: generation.type,
    };

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    console.error('[Mock Generation API] Status check error:', error);
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
    console.error('[Mock Generation API] History error:', error);
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
    console.error('[Mock Generation API] Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel generation',
    });
  }
});

export default router;
