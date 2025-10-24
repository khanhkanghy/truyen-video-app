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

/**
 * ⭐ NEW: Phân tích TOÀN BỘ chapter như một đạo diễn/biên kịch phim
 * Thay vì split theo xuống dòng, LLM sẽ tự phân tích và chia thành scenes
 *
 * @param {string} chapterContent - Toàn bộ nội dung chapter
 * @param {string} genre - Thể loại truyện
 * @param {Array} characters - Danh sách nhân vật
 * @param {string} userPrompt - Yêu cầu tùy chỉnh từ user (optional)
 * @returns {Promise<Object>} { scenes: [...], metadata: {...} }
 */
export async function analyzeChapterAsDirector(
  chapterContent,
  genre = 'Huyền huyễn',
  characters = [],
  userPrompt = ''
) {
  // Validate
  if (!chapterContent || chapterContent.trim().length === 0) {
    throw new Error('Chapter content cannot be empty');
  }

  const characterNames = characters.map(c => c.name).join(', ') || 'Chưa có nhân vật';
  const characterInfo = characters.map(c =>
    `- ${c.name}: ${c.description || 'Không có mô tả'} (${c.appearance_prompt || 'Không có appearance'})`
  ).join('\n') || 'Chưa có thông tin nhân vật';

  const systemPrompt = `Bạn là một ĐẠO DIỄN và BIÊN KỊCH PHIM chuyên nghiệp, chuyên về thể loại ${genre}.

VAI TRÒ CỦA BẠN:
- Đọc và hiểu toàn bộ câu chuyện như một đạo diễn điện ảnh
- Phân chia câu chuyện thành các CẢNH QUAY (scenes) hợp lý
- Mỗi scene phải có tính liên kết và mạch truyện rõ ràng
- KHÔNG phân chia theo xuống dòng, mà phân chia theo logic kịch bản

NGUYÊN TẮC PHÂN CẢNH:
- Một scene = một hành động/sự kiện liên tục tại một địa điểm/thời gian
- Thay đổi địa điểm → scene mới
- Thay đổi thời gian đáng kể → scene mới
- Thay đổi nhóm nhân vật chính → scene mới
- Chuyển từ hành động sang đối thoại quan trọng → có thể là scene mới
- Mỗi scene nên dài 10-30 giây video (khoảng 100-300 từ)

YÊU CẦU CHẤT LƯỢNG:
- Mỗi scene phải có đầu-giữa-cuối rõ ràng
- Visual description phải chi tiết như script quay phim thực tế
- Camera angles phải phù hợp với mood và action
- Dialogue phải được extract chính xác
- Lighting và atmosphere phải được mô tả cụ thể

OUTPUT FORMAT: JSON với array of scenes, mỗi scene có đầy đủ thông tin như một shot list chuyên nghiệp.`;

  const userPromptSection = userPrompt
    ? `\n\nYÊU CẦU ĐỘC BIỆT TỪ NGƯỜI DÙNG:\n${userPrompt}\n(Hãy tuân theo yêu cầu này khi phân tích!)`
    : '';

  const mainPrompt = `Phân tích toàn bộ chapter truyện ${genre} sau đây và chia thành các CẢNH QUAY như một đạo diễn chuyên nghiệp:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHAPTER CONTENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${chapterContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THÔNG TIN NHÂN VẬT TRONG BỘ TRUYỆN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${characterInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userPromptSection}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hãy phân tích và trả về JSON theo format sau:

{
  "total_scenes": <số lượng scenes>,
  "estimated_duration": "<tổng thời lượng ước tính, VD: '5 phút'>",
  "story_summary": "<tóm tắt ngắn gọn câu chuyện trong chapter này>",
  "scenes": [
    {
      "scene_number": 1,
      "scene_title": "<tiêu đề ngắn gọn cho scene, VD: 'Lý Tiểu Long đột phá tu vi'>",
      "duration_seconds": <thời lượng ước tính 10-30s>,
      "scene_type": "dialogue|action|description|mixed",

      "location": {
        "name": "<tên địa điểm cụ thể bằng tiếng Anh>",
        "description": "<mô tả chi tiết bối cảnh>",
        "time_of_day": "dawn|morning|noon|afternoon|dusk|evening|night|midnight",
        "weather": "clear|cloudy|rainy|snowy|foggy|stormy|windy|sunny",
        "lighting": "<mô tả ánh sáng: natural sunlight, torchlight, moonlight, etc.>"
      },

      "characters": [
        {
          "name": "<tên nhân vật>",
          "role_in_scene": "protagonist|antagonist|supporting|background",
          "actions": ["<hành động 1>", "<hành động 2>"],
          "emotions": ["<cảm xúc 1>", "<cảm xúc 2>"],
          "dialogue": "<lời thoại nếu có, giữ nguyên tiếng Việt>"
        }
      ],

      "action_description": "<mô tả chi tiết hành động trong scene bằng TIẾNG VIỆT>",

      "visual_description": "<mô tả chi tiết VISUAL cho AI image generation bằng TIẾNG ANH, 150-250 từ, như một script quay phim chuyên nghiệp, bao gồm: composition, foreground/background, character positions, props, lighting, atmosphere, colors, artistic style>",

      "camera": {
        "shot_type": "extreme-close-up|close-up|medium-close-up|medium-shot|full-shot|wide-shot|extreme-wide-shot|aerial-view",
        "camera_angle": "eye-level|high-angle|low-angle|dutch-angle|over-shoulder|point-of-view|bird-eye-view",
        "camera_movement": "static|pan-left|pan-right|tilt-up|tilt-down|zoom-in|zoom-out|dolly-forward|dolly-back|tracking|crane|handheld|steadicam",
        "focus": "<điểm focus chính trong frame>"
      },

      "mood_and_tone": {
        "overall_mood": "peaceful|tense|dramatic|romantic|mysterious|action-packed|melancholic|joyful|suspenseful|epic",
        "emotional_intensity": "low|medium|high|extreme",
        "pacing": "slow|moderate|fast|very-fast"
      },

      "visual_elements": {
        "key_props": ["<vật dụng quan trọng 1>", "<vật dụng 2>"],
        "special_effects": ["<hiệu ứng đặc biệt nếu có: magic, fire, energy, etc.>"],
        "colors_palette": ["<màu sắc chủ đạo>"],
        "artistic_style": "<phong cách nghệ thuật phù hợp với thể loại>"
      },

      "audio_notes": {
        "ambient_sounds": ["<âm thanh môi trường>"],
        "music_suggestion": "<gợi ý nhạc nền>",
        "sound_effects": ["<hiệu ứng âm thanh>"]
      },

      "continuity_notes": "<ghi chú về tính liên tục với scene trước/sau>"
    }
  ]
}

LƯU Ý QUAN TRỌNG:
1. PHÂN CẢNH dựa trên LOGIC KỊCH BẢN, không phải xuống dòng
2. Mỗi scene phải có đủ nội dung để tạo thành một đoạn video có nghĩa
3. Visual description phải CỰC KỲ CHI TIẾT, như đang viết script cho ekip quay phim
4. Dialogue phải giữ NGUYÊN tiếng Việt
5. Đảm bảo tính liên tục giữa các scenes
6. Mỗi scene nên dài 10-30 giây (khoảng 100-300 từ nội dung)`;

  try {
    console.log('🎬 Analyzing chapter as a professional director...');
    console.log(`📝 Content length: ${chapterContent.length} characters`);
    if (userPrompt) {
      console.log(`👤 User custom prompt: ${userPrompt}`);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for better understanding
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: mainPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4, // Slightly higher for creativity
      max_tokens: 16000, // Need more tokens for detailed analysis
    });

    const result = JSON.parse(response.choices[0].message.content);

    console.log(`✅ Director analysis completed!`);
    console.log(`   📊 Scenes: ${result.total_scenes}`);
    console.log(`   ⏱️  Duration: ${result.estimated_duration}`);
    console.log(`   🎯 Story: ${result.story_summary?.substring(0, 100)}...`);

    return {
      ...result,
      _metadata: {
        model: 'gpt-4o',
        tokens: response.usage?.total_tokens || 0,
        cost: calculateCostForModel(response.usage, 'gpt-4o'),
        user_prompt: userPrompt || null,
      }
    };

  } catch (error) {
    console.error('❌ Director analysis error:', error.message);
    throw new Error(`Chapter analysis failed: ${error.message}`);
  }
}

/**
 * Calculate cost based on model
 */
function calculateCostForModel(usage, model = 'gpt-4o-mini') {
  if (!usage) return 0;

  const costs = {
    'gpt-4o-mini': {
      input: 0.15 / 1_000_000,
      output: 0.60 / 1_000_000,
    },
    'gpt-4o': {
      input: 2.50 / 1_000_000,
      output: 10.00 / 1_000_000,
    }
  };

  const modelCost = costs[model] || costs['gpt-4o-mini'];
  const inputCost = usage.prompt_tokens * modelCost.input;
  const outputCost = usage.completion_tokens * modelCost.output;

  return inputCost + outputCost;
}

export default {
  analyzeSceneWithLLM,
  generateEnhancedPrompt,
  analyzeChapterAsDirector, // ⭐ NEW
};
