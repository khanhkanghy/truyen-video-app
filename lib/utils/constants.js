/**
 * AI Configuration Constants
 * Các giá trị cấu hình cho AI services
 */

export const AI_CONFIG = {
  // OpenAI Configuration
  OPENAI: {
    MODEL: 'gpt-4o-mini', // Cost-effective model
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.3, // Lower = more consistent
  },

  // Fal.ai Configuration
  FAL: {
    MODEL: 'fal-ai/flux-pro/v1.1',
    IMAGE_SIZE: {
      width: 1024,
      height: 576, // 16:9 aspect ratio for video
    },
    INFERENCE_STEPS: 28,
    GUIDANCE_SCALE: 3.5,
  },

  // Cost tracking (USD)
  COSTS: {
    GPT4O_MINI_INPUT: 0.15 / 1_000_000, // per token
    GPT4O_MINI_OUTPUT: 0.60 / 1_000_000,
    FAL_IMAGE: 0.004, // per image
    LUMA_VIDEO: 0.05, // per video
  },
};

/**
 * Scene Analysis Constants
 */
export const SCENE_CONFIG = {
  AVG_DURATION_SECONDS: 15,
  MIN_DURATION_SECONDS: 10,
  MAX_DURATION_SECONDS: 20,
  MAX_SCENES_PER_PARAGRAPH: 3,
};

/**
 * Content Validation
 */
export const VALIDATION = {
  MIN_CONTENT_LENGTH: 100,
  MAX_CONTENT_LENGTH: 100000,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
};

/**
 * Genre-specific styling for prompts
 */
export const GENRE_STYLES = {
  'Tiên hiệp': 'chinese xianxia fantasy, cultivation world, flying swords, mystical qi energy, ancient chinese architecture, immortal cultivators, jade robes, martial arts',
  'Kiếm hiệp': 'wuxia style, martial arts masters, traditional hanfu clothing, bamboo forest, ancient china, kungfu, swordplay, flowing robes',
  'Huyền huyễn': 'eastern fantasy, magic circles, mythical beasts, dragons, phoenixes, mystical powers, alternate realm',
  'Đô thị': 'modern urban setting, contemporary city, skyscrapers, realistic lighting, modern fashion',
  'Lãng mạn': 'romantic atmosphere, soft dreamy lighting, beautiful scenery, tender moments',
  'Kinh dị': 'horror atmosphere, dark shadows, eerie lighting, suspenseful mood, gothic elements',
  'Khoa học viễn tưởng': 'sci-fi setting, futuristic technology, neon lights, cyberpunk, space opera',
};

/**
 * Standard negative prompt for image generation
 */
export const NEGATIVE_PROMPT = `
  blurry, low quality, low resolution, pixelated, jpeg artifacts,
  distorted, deformed, disfigured, ugly, bad anatomy, bad proportions,
  extra limbs, missing limbs, floating limbs, disconnected limbs,
  poorly drawn face, poorly drawn hands, poorly drawn fingers,
  mutation, mutated, extra fingers, missing fingers,
  text, watermark, signature, username, error,
  out of frame, cropped, worst quality, low quality, normal quality,
  duplicate, morbid, mutilated, extra heads, malformed limbs,
  bad hands, bad feet, poorly drawn eyes, cross-eyed
`.trim().replace(/\s+/g, ' ');
