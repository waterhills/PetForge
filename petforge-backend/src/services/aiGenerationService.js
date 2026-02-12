import fetch from 'node-fetch';

/**
 * AI Generation Service
 * Integrates with ComfyUI for image and 3D model generation
 */

class AIService {
  constructor() {
    // ComfyUI configuration - update these values with your actual ComfyUI instance
    this.comfyUIUrl = process.env.COMFYUI_URL || 'http://localhost:8188';
    this.clientId = process.env.COMFYUI_CLIENT_ID || 'petforge-client';
  }

  /**
   * Queue a generation task
   * @param {Object} taskData - Generation task parameters
   * @returns {Promise<string>} Task ID for tracking
   */
  async queueGeneration(taskData) {
    try {
      const prompt = this.buildPrompt(taskData);

      const requestBody = {
        client_id: this.clientId,
        task: {
          id: `pet_${Date.now()}`,
          prompt: prompt,
          type: taskData.type || 'image', // 'image' or '3d'
          // ComfyUI workflow configuration
          workflow: {
            name: 'PetForge_Generation_Workflow',
          },
        },
        // Queue ComfyUI to process immediately
        queue: 'default',
      };

      console.log('[AI Service] Queueing generation:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.comfyUIUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI request failed: ${response.statusText}`);
      }

      const result = await response.json();

      return result.task_id || result.id; // Return task ID for tracking

    } catch (error) {
      console.error('[AI Service] Queue generation error:', error);
      throw error;
    }
  }

  /**
   * Build ComfyUI prompt based on task type and parameters
   * @param {Object} taskData - Task data including type, style, options
   * @returns {string} ComfyUI-compatible prompt string
   */
  buildPrompt(taskData) {
    const { type, style, petName, customPrompt } = taskData;

    // Base prompt template for pet image generation
    let basePrompt = `A high-quality ${style || 'cartoon'} style image of a cute pet`;

    // Style-specific modifiers
    const styleModifiers = {
      'pixar': 'with vibrant colors, smooth textures, 3D rendering style like Pixar animation',
      'clay': 'as a soft clay animation character, with handcrafted texture and warm lighting',
      'cyber': 'with neon lights, mechanical elements, futuristic cyberpunk aesthetic',
      'line': 'using clean minimalist line art style, simple elegant outlines',
    };

    // Add style-specific details
    if (styleModifiers[style]) {
      basePrompt += `, ${styleModifiers[style]}`;
    }

    // Add pet name if provided
    if (petName) {
      basePrompt += `, the pet's name is "${petName}"`;
    }

    // Add custom prompt if user provided one
    if (customPrompt) {
      basePrompt += `, ${customPrompt}`;
    }

    // For 3D generation, add additional context
    if (type === '3d') {
      basePrompt += ', full body 3D character model, GLB format, suitable for 3D printing and game engines';
    }

    return basePrompt;
  }

  /**
   * Check generation status from ComfyUI
   * @param {string} taskId - Task ID from queueGeneration
   * @returns {Promise<Object>} Status and result information
   */
  async checkStatus(taskId) {
    try {
      const response = await fetch(`${this.comfyUIUrl}/history/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ComfyUI status check failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse ComfyUI response
      const result = {
        status: this.parseStatus(data),
        taskId: data.task_id || taskId,
        progress: data.progress || 0,
        resultUrl: data.output?.result?.[0]?.filename || null,
        model3dUrl: data.output?.result?.[1]?.filename || null, // Second output for 3D model
        error: data.error || null,
      };

      console.log('[AI Service] Generation status:', result);

      return result;

    } catch (error) {
      console.error('[AI Service] Status check error:', error);
      throw error;
    }
  }

  /**
   * Parse ComfyUI status to our standard format
   * @param {Object} data - ComfyUI response data
   * @returns {string} Standardized status (pending/processing/completed/failed)
   */
  parseStatus(data) {
    // ComfyUI status formats:
    // - 'queued' → pending
    // - 'executing' → processing
    // - 'success' with outputs → completed
    // - 'failed' or 'error' → failed

    const status = data.status || data.queue_status?.[0]?.status;

    if (status === 'queued' || !status) {
      return 'pending';
    } else if (status === 'executing') {
      return 'processing';
    } else if (status === 'success') {
      return 'completed';
    } else {
      return 'failed';
    }
  }

  /**
   * Wait for generation to complete (polling)
   * @param {string} taskId - Task ID to check
   * @param {number} interval - Polling interval in ms (default: 2000ms)
   * @param {number} maxAttempts - Maximum polling attempts (default: 150)
   * @returns {Promise<Object>} Final generation result
   */
  async waitForCompletion(taskId, interval = 2000, maxAttempts = 150) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const result = await this.checkStatus(taskId);

      // Return if completed
      if (result.status === 'completed') {
        console.log('[AI Service] Generation completed successfully');
        return result;
      }

      // Return if failed
      if (result.status === 'failed') {
        console.error('[AI Service] Generation failed');
        return result;
      }

      // Still processing, wait and retry
      console.log(`[AI Service] Still processing... (${result.progress || 0}%) attempt ${attempts + 1}/${maxAttempts}`);

      await this.sleep(interval);
      attempts++;
    }

    throw new Error('Generation timeout: max attempts reached');
  }

  /**
   * Utility: Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process completed generation and save to database
   * @param {Object} generationData - Generation result data
   * @param {string} userId - User ID
   * @param {string} petIpId - PetIP ID to link to
   */
  async processCompletedGeneration(generationData, userId, petIpId) {
    const { prisma } = await import('../config/database.js');

    // Create Generation record
    const generation = await prisma.generation.create({
      data: {
        userId,
        petIpId,
        type: generationData.type === '3d' ? '3d' : '2d',
        status: 'completed',
        prompt: JSON.stringify(generationData.prompt || {}),
        inputImage: generationData.inputImage || null,
        resultUrl: generationData.resultUrl || null,
        resultData: generationData.resultData || null, // Store full result data
        cost: generationData.cost || 10, // Default cost: 10 credits
        completedAt: new Date(),
      },
    });

    console.log('[AI Service] Generation record created:', generation.id);

    return generation;
  }
}

export default new AIService();
