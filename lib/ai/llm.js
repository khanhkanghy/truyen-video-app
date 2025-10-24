/**
 * LLM Service - OpenAI Integration
 * Phân tích văn bản truyện sử dụng GPT-4o-mini
 */

import OpenAI from 'openai';
import { AI_CONFIG, GENRE_STYLES } from '@/lib/utils/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Phân tích đoạn văn truyện bằng LLM
 * @param {string} paragraphText - Nội dung đoạn văn
 * @param {string} genre - Thể loại truyện
 * @param {Array} characters - Danh sách nhân vật đã biết
 * @returns {Promise<Object>} Kết quả phân tích
 */
export async function analyzeSceneWithLLM(paragraphText, genre = 'Huyền huyễn', characters = []) {
  // Validate input
  if (!paragraphText || paragraphText.trim().length === 0) {
    throw new Error('Paragraph text cannot be empty');
  }

  const characterNames = characters.map(c => c.name).join(', ') || 'Chưa có nhân vật';

  const systemPrompt = `Bạn là chuyên gia phân tích văn học Việt Nam, đặc biệt về thể loại ${genre}.

NHIỆM VỤ:
- Phân tích sâu đoạn văn truyện để tạo cảnh phim (scene) chi tiết
- Xác định nhân vật, địa điểm, thời gian, tâm trạng
- Đề xuất góc máy và chuyển động phù hợp
- Mô tả visual elements cụ thể cho AI image generation

YÊU CẦU:
- Luôn trả về valid JSON
- Mô tả bằng tiếng Anh cho phần scene_description (để dùng cho AI image gen)
- Chi tiết, cụ thể, vivid`;

  const userPrompt = `Phân tích đoạn văn truyện ${genre} sau:

"""
${paragraphText}
"""

Nhân vật đã biết trong bộ truyện: ${characterNames}

Trả về JSON theo format SAU (BẮT BUỘC):
{
  "scene_type": "dialogue|action|description|mixed",
  "characters_mentioned": ["tên đầy đủ nhân vật xuất hiện trong đoạn này"],
  "location": "mô tả địa điểm CỤ THỂ bằng tiếng Anh (VD: 'Snow-covered Jade Mountain peak, ancient pine trees, cliff edge')",
  "time_of_day": "dawn|morning|noon|afternoon|dusk|evening|night|midnight",
  "weather": "clear sky|cloudy|rainy|snowy|foggy|stormy|windy|sunny",
  "mood": "peaceful|tense|dramatic|romantic|mysterious|action-packed|melancholic|joyful|suspenseful",
  "emotions": ["danh sách cảm xúc của nhân vật: happy, sad, angry, determined, fearful, excited, etc."],
  "key_actions": ["hành động quan trọng: fighting, talking, walking, meditating, etc."],
  "visual_elements": ["yếu tố thị giác: clothing, weapons, effects, animals, objects"],
  "camera_suggestion": "extreme-close-up|close-up|medium-shot|full-shot|wide-shot|aerial-view|low-angle|high-angle",
  "camera_movement": "static|pan|tilt|zoom-in|zoom-out|dolly-forward|tracking|crane",
  "scene_description": "Mô tả scene CHI TIẾT bằng TIẾNG ANH cho AI image generation (100-200 từ, tập trung vào visual details, lighting, composition, atmosphere)"
}`;

  try {
    console.log('🤖 Calling OpenAI GPT-4o-mini for scene analysis...');

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.OPENAI.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: AI_CONFIG.OPENAI.TEMPERATURE,
      max_tokens: AI_CONFIG.OPENAI.MAX_TOKENS,
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Log cho debugging
    console.log('✅ LLM Analysis completed:', {
      scene_type: analysis.scene_type,
      characters: analysis.characters_mentioned?.length || 0,
      mood: analysis.mood,
      tokens_used: response.usage?.total_tokens || 0,
    });

    // Validate required fields
    if (!analysis.scene_type || !analysis.scene_description) {
      throw new Error('LLM returned incomplete analysis');
    }

    return {
      ...analysis,
      _metadata: {
        model: AI_CONFIG.OPENAI.MODEL,
        tokens: response.usage?.total_tokens || 0,
        cost: calculateCost(response.usage),
      }
    };

  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);

    // Fallback to basic analysis if LLM fails
    console.warn('⚠️ Falling back to basic analysis...');
    return fallbackAnalysis(paragraphText, characters);
  }
}

/**
 * Generate enhanced visual prompt using LLM
 * @param {Object} sceneAnalysis - Kết quả phân tích từ analyzeSceneWithLLM
 * @param {string} genre - Thể loại truyện
 * @param {Array} characters - Nhân vật trong scene
 * @returns {Promise<Object>} { visualPrompt, negativePrompt }
 */
export async function generateEnhancedPrompt(sceneAnalysis, genre, characters = []) {
  const characterPrompts = characters
    .map(c => c.appearance_prompt || `${c.name}`)
    .join('; ');

  const systemPrompt = `You are an expert Stable Diffusion prompt engineer specializing in cinematic storytelling for ${genre} genre.

Create highly detailed, artistic prompts that produce beautiful, professional-quality images.

GUIDELINES:
- Start with main subject and action
- Add character details with specific appearance
- Describe environment, lighting, and atmosphere
- Include camera angle and composition
- Use quality-boosting keywords
- Be specific, vivid, and visual
- Comma-separated keywords
- Length: 100-150 words
- Professional photography/cinematic style`;

  const userPrompt = `Create a Stable Diffusion image generation prompt for this scene:

SCENE DESCRIPTION: ${sceneAnalysis.scene_description}

CONTEXT:
- Genre: ${genre}
- Genre Style: ${GENRE_STYLES[genre] || 'fantasy art'}
- Characters: ${characterPrompts || 'No specific characters'}
- Location: ${sceneAnalysis.location}
- Time: ${sceneAnalysis.time_of_day}
- Weather: ${sceneAnalysis.weather}
- Mood: ${sceneAnalysis.mood}
- Camera: ${sceneAnalysis.camera_suggestion}
- Movement: ${sceneAnalysis.camera_movement}
- Visual Elements: ${sceneAnalysis.visual_elements?.join(', ')}

REQUIREMENTS:
- Cinematic composition with ${sceneAnalysis.camera_suggestion}
- ${sceneAnalysis.mood} atmosphere
- Professional quality, detailed
- Include all visual elements
- Match genre style
- High resolution, 4K quality

Return ONLY the prompt string (no quotes, no explanations).`;

  try {
    console.log('🎨 Generating enhanced visual prompt...');

    const response = await openai.chat.completions.create({
      model: AI_CONFIG.OPENAI.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const visualPrompt = response.choices[0].message.content.trim();

    console.log('✅ Visual prompt generated');

    return {
      visualPrompt,
      negativePrompt: getNegativePrompt(),
    };

  } catch (error) {
    console.error('❌ Prompt Generation Error:', error);

    // Fallback to template-based prompt
    return fallbackPromptGeneration(sceneAnalysis, genre, characters);
  }
}

/**
 * Calculate OpenAI API cost
 */
function calculateCost(usage) {
  if (!usage) return 0;

  const inputCost = usage.prompt_tokens * AI_CONFIG.COSTS.GPT4O_MINI_INPUT;
  const outputCost = usage.completion_tokens * AI_CONFIG.COSTS.GPT4O_MINI_OUTPUT;

  return inputCost + outputCost;
}

/**
 * Get standard negative prompt
 */
function getNegativePrompt() {
  return `blurry, low quality, low resolution, pixelated, jpeg artifacts, distorted, deformed, disfigured, ugly, bad anatomy, bad proportions, extra limbs, missing limbs, floating limbs, poorly drawn face, poorly drawn hands, mutation, mutated, text, watermark, signature, out of frame, cropped, worst quality, duplicate`;
}

/**
 * Fallback analysis khi LLM fail (dùng keyword-based như cũ)
 */
function fallbackAnalysis(text, characters) {
  console.warn('⚠️ Using fallback keyword-based analysis');

  const hasDialogue = text.includes('"') || text.includes('"') || text.includes('"');
  const actionKeywords = ['chiến', 'đánh', 'bay', 'nhảy', 'chạy', 'tấn công', 'đánh nhau'];
  const hasAction = actionKeywords.some(kw => text.toLowerCase().includes(kw));

  return {
    scene_type: hasDialogue ? 'dialogue' : (hasAction ? 'action' : 'description'),
    characters_mentioned: characters.filter(c => text.includes(c.name)).map(c => c.name),
    location: 'Unspecified location',
    time_of_day: 'day',
    weather: 'clear sky',
    mood: 'neutral',
    emotions: [],
    key_actions: [],
    visual_elements: [],
    camera_suggestion: 'medium-shot',
    camera_movement: 'static',
    scene_description: text.substring(0, 200),
    _fallback: true,
  };
}

/**
 * Fallback prompt generation
 */
function fallbackPromptGeneration(sceneAnalysis, genre, characters) {
  let prompt = 'cinematic style, ';

  if (characters.length > 0) {
    prompt += characters.map(c => c.appearance_prompt || c.name).join(', ') + ', ';
  }

  prompt += `${sceneAnalysis.location}, `;
  prompt += `${sceneAnalysis.mood} atmosphere, `;

  if (GENRE_STYLES[genre]) {
    prompt += GENRE_STYLES[genre] + ', ';
  }

  prompt += 'high quality, detailed, 4k, professional photography';

  return {
    visualPrompt: prompt,
    negativePrompt: getNegativePrompt(),
  };
}

export default {
  analyzeSceneWithLLM,
  generateEnhancedPrompt,
};
