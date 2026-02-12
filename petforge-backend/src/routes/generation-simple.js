import express from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';

const router = express.Router();

// Validation schemas
const queueGenerationSchema = z.object({
  type: z.enum(['image', '3d']).optional(),
  style: z.enum(['pixar', 'clay', 'cyber', 'line']).optional(),
  petName: z.string().min(1).max(50).optional(),
  customPrompt: z.string().max(500).optional(),
});

// Simple test endpoint - NO AUTH required
router.post('/queue-simple', async (req, res) => {
  try {
    console.log('[Simple Test] Received request:', req.body);

    const { type = 'image', style = 'pixar', petName = 'Test Pet', customPrompt = '' } = req.body;

    // Style result URLs
    const styleResults = {
      'pixar': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Sa8qqFmL0M66DCtFnIEqEn8VgR9go5iUeFye7xfD0xoA6i_lrwoD2kz6ApKEcv-SqFgdfM3WVF8EKj3IQSZzkKQm3AXTDMrX_O9r9wyJ75KZhf332CDQQzNRes30YyuPqtXjyLP9q2AorxJJPnKk87oB3eHf_eMEONhAKXEDOOMLhjedCqImRAPfrJ-JSBSzcz_wRkjBIH8sSNZBsvCksoQo8uiZhrO8fUNOpo1WI3LSFmxLbNuAxozOoN_2Z28sNL00-mXgY1Jw',
      'clay': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhOEonJyjMgn5ZMDofXY8R8Lm5Z6LbOvaUeQllzDpcDSxWF31wovApu3h3Jyd4t1YPVZNtV83kHvKoywfgw-RZId-CXwO8XHnKEHlbrNL5nCqFafUGPC4VRvhnTs1TJ0wuxdbbA96i-4-ccIJL5sf44Kb3Qw7w_auxyShOLSUlzprxr6C6pCCzjmgV5zdX4q6u5dQEYgodfNTLv756QwAwwh12xAMIJ9yJokp8z9UwES2VnRg7cI39ACrqRZCpsmb1m4jAvR8v7ss',
      'cyber': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRh308zlJaHuXA8Uq64LC_rcZ-rfnxBqoKqCgzT3tZ9euRmUR6JRabWcdrGRlEhuLZ6zBGYEdYMN0-4NP2sGam5IeOhs1v-7zIqrjcmiShNpXUNxqU-Q0lVukatoUUAYwOWvjwLkKkWvlrOKiwCpBVFetshlgfzTMG1rCz3fOXOxVj3WoeUC_DBCdpSj8RMBXtB2JwfU7myR_Jflf5mIguQXkDhIg3jfFIvxGOyVGP_GVgb-JklPRqHrV6n8CB9NMcVrfF2XVpN2Q',
      'line': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9BAmu55ppPMoqZqsdKsTvSGpMAO4yFRAORLZN2q_YB_sTJaQKxl4ahkCYVmPvFkYb6VD8EgnnQqm9JHrliVS0pBxcTLxbuiEq9nfEpwcx-mMLIAx3f4c0816hvTgGRi50kRDvp4wWTO5h7FINB4D4AteJ9W7_AgcFd1lkk0TWMkEIvFZDxWd0pjpZX3p2NA4Auu_2JKik11kyTzHd3dBlfjbuG7z7uqyqZr-23_GtCxYA-y1JMl_gwH8j-RcLJKcsweZ2WVlhPdM',
    };

    const resultUrl = styleResults[style] || styleResults.pixar;
    const cost = type === '3d' ? 10 : 5;

    console.log('[Simple Test] Returning result:', { style, resultUrl });

    // Return immediately with success
    res.json({
      success: true,
      data: {
        taskId: `simple_test_${Date.now()}`,
        resultUrl,
        message: 'Generation completed successfully (simple test mode)',
        testMode: true,
        noAuthRequired: true,
        style,
        type,
        cost,
      },
    });

  } catch (error) {
    console.error('[Simple Test] Error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Test generation failed',
    });
  }
});

// Test status endpoint
router.get('/status-simple/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('[Simple Test] Status check for:', taskId);

    res.json({
      success: true,
      data: {
        status: 'completed',
        taskId,
        progress: 100,
        resultUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1Sa8qqFmL0M66DCtFnIEqEn8VgR9go5iUeFye7xfD0xoA6i_lrwoD2kz6ApKEcv-SqFgdfM3WVF8EKj3IQSZzkKQm3AXTDMrX_O9r9wyJ75KZhf332CDQQzNRes30YyuPqtXjyLP9q2AorxJJPnKk87oB3eHf_eMEONhAKXEDOOMLhjedCqImRAPfrJ-JSBSzcz_wRkjBIH8sSNZBsvCksoQo8uiZhrO8fUNOpo1WI3LSFmxLbNuAxozOoN_2Z28sNL00-mXgY1Jw',
        type: 'image',
      },
    });

  } catch (error) {
    console.error('[Simple Test] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
    });
  }
});

export default router;
