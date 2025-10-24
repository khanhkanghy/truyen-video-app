/**
 * Image Generation Service - Fal.ai Integration
 * Generate images using Stable Diffusion (Flux Pro)
 */

import * as fal from '@fal-ai/serverless-client';
import { AI_CONFIG } from '@/lib/utils/constants';

// Configure Fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

/**
 * Generate image from text prompt using Flux Pro
 * @param {string} visualPrompt - The text prompt
 * @param {string} negativePrompt - Negative prompt
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Image URL
 */
export async function generateSceneImage(
  visualPrompt,
  negativePrompt = '',
  options = {}
) {
  // Validate input
  if (!visualPrompt || visualPrompt.trim().length === 0) {
    throw new Error('Visual prompt cannot be empty');
  }

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY not configured. Please add to .env.local');
  }

  console.log('🎨 Generating image with Fal.ai Flux Pro...');
  console.log('📝 Prompt:', visualPrompt.substring(0, 100) + '...');

  try {
    const result = await fal.subscribe(AI_CONFIG.FAL.MODEL, {
      input: {
        prompt: visualPrompt,
        negative_prompt: negativePrompt,
        image_size: {
          width: options.width || AI_CONFIG.FAL.IMAGE_SIZE.width,
          height: options.height || AI_CONFIG.FAL.IMAGE_SIZE.height,
        },
        num_inference_steps: options.steps || AI_CONFIG.FAL.INFERENCE_STEPS,
        guidance_scale: options.guidance || AI_CONFIG.FAL.GUIDANCE_SCALE,
        num_images: 1,
        enable_safety_checker: true,
        safety_tolerance: '2',
        output_format: 'jpeg',
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          const lastLog = update.logs?.[update.logs.length - 1];
          if (lastLog) {
            console.log(`  ⏳ ${lastLog.message || 'Processing...'}`);
          }
        }
      },
    });

    if (!result.images || result.images.length === 0) {
      throw new Error('No images generated');
    }

    const imageUrl = result.images[0].url;
    console.log('✅ Image generated successfully!');
    console.log('🔗 URL:', imageUrl);

    return imageUrl;

  } catch (error) {
    console.error('❌ Fal.ai Error:', error.message);

    // Check for common errors
    if (error.message?.includes('credentials')) {
      throw new Error('Invalid FAL_KEY. Please check your API key.');
    }

    if (error.message?.includes('quota')) {
      throw new Error('Fal.ai quota exceeded. Please check your account.');
    }

    throw new Error(`Image generation failed: ${error.message}`);
  }
}

/**
 * Generate image with character LoRA for consistency
 * @param {string} visualPrompt - The text prompt
 * @param {string} loraUrl - LoRA model URL
 * @param {string} triggerWord - Trigger word for LoRA
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Image URL
 */
export async function generateWithCharacterLora(
  visualPrompt,
  loraUrl,
  triggerWord,
  options = {}
) {
  if (!loraUrl || !triggerWord) {
    console.warn('⚠️ No LoRA provided, using standard generation');
    return generateSceneImage(visualPrompt, options.negativePrompt, options);
  }

  console.log('🎨 Generating with character LoRA...');
  console.log('🔑 Trigger word:', triggerWord);

  try {
    const enhancedPrompt = `${triggerWord}, ${visualPrompt}`;

    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: options.negativePrompt || '',
        loras: [{
          path: loraUrl,
          scale: options.loraScale || 0.85,
        }],
        image_size: {
          width: options.width || AI_CONFIG.FAL.IMAGE_SIZE.width,
          height: options.height || AI_CONFIG.FAL.IMAGE_SIZE.height,
        },
        num_inference_steps: options.steps || AI_CONFIG.FAL.INFERENCE_STEPS,
        guidance_scale: options.guidance || AI_CONFIG.FAL.GUIDANCE_SCALE,
      },
    });

    const imageUrl = result.images[0].url;
    console.log('✅ Image with LoRA generated!');

    return imageUrl;

  } catch (error) {
    console.error('❌ LoRA Generation Error:', error);
    throw new Error(`LoRA generation failed: ${error.message}`);
  }
}

/**
 * Batch generate images for multiple scenes
 * @param {Array} scenes - Array of scene objects with prompts
 * @returns {Promise<Array>} Array of results
 */
export async function batchGenerateImages(scenes) {
  console.log(`🎨 Batch generating ${scenes.length} images...`);

  const results = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`\n[${i + 1}/${scenes.length}] Generating scene ${scene.scene_number}...`);

    try {
      const imageUrl = await generateSceneImage(
        scene.visual_prompt,
        scene.negative_prompt
      );

      results.push({
        sceneId: scene.id,
        success: true,
        imageUrl,
      });

      // Small delay to avoid rate limiting
      if (i < scenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Failed scene ${scene.scene_number}:`, error.message);
      results.push({
        sceneId: scene.id,
        success: false,
        error: error.message,
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Batch complete: ${successCount}/${scenes.length} successful`);

  return results;
}

export default {
  generateSceneImage,
  generateWithCharacterLora,
  batchGenerateImages,
};
