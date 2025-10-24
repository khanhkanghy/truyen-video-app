/**
 * Chapter Analysis API - UPGRADED WITH LLM
 * Phân tích chương truyện sử dụng AI (OpenAI GPT-4o-mini)
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  analyzeSceneWithLLM,
  generateEnhancedPrompt
} from '@/lib/ai/llm';
import { SCENE_CONFIG } from '@/lib/utils/constants';

export async function POST(request) {
  try {
    const { seriesId, chapterNumber, title, content } = await request.json();

    if (!seriesId || !content) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin' },
        { status: 400 }
      );
    }

    console.log('\n🚀 Starting AI-powered chapter analysis...');
    console.log(`📚 Series ID: ${seriesId}`);
    console.log(`📖 Chapter: ${chapterNumber || 1}`);
    console.log(`📝 Content length: ${content.length} characters`);

    // 1. Lấy thông tin series và characters
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select(`
        *,
        characters(*)
      `)
      .eq('id', seriesId)
      .single();

    if (seriesError) {
      console.error('❌ Series error:', seriesError);
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bộ truyện' },
        { status: 404 }
      );
    }

    console.log(`✅ Series loaded: ${series.title} (${series.genre})`);
    console.log(`👥 Characters: ${series.characters?.length || 0}`);

    // 2. ⭐ PHÂN TÍCH VĂN BẢN VỚI AI (UPGRADED)
    const analysis = await analyzeChapterWithAI(content, series);

    console.log('\n📊 Analysis results:');
    console.log(`  - Paragraphs: ${analysis.paragraphs.length}`);
    console.log(`  - Scenes: ${analysis.totalScenes}`);
    console.log(`  - Characters detected: ${analysis.detectedCharacters.length}`);
    console.log(`  - Duration: ${analysis.estimatedDuration}`);

    // 3. Lưu chapter vào database
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert([{
        series_id: seriesId,
        chapter_number: chapterNumber || 1,
        title: title || `Chương ${chapterNumber || 1}`,
        content: content,
        total_paragraphs: analysis.paragraphs.length,
        total_scenes: analysis.totalScenes,
        estimated_duration: analysis.estimatedDuration,
        status: 'analyzed'
      }])
      .select()
      .single();

    if (chapterError) {
      console.error('❌ Chapter error:', chapterError);
      return NextResponse.json(
        { success: false, error: chapterError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Chapter saved: ${chapter.id}`);

    // 4. Lưu paragraphs
    const paragraphsData = analysis.paragraphs.map((para, index) => ({
      chapter_id: chapter.id,
      paragraph_number: index + 1,
      content: para.content,
      scene_type: para.type,
      mentioned_characters: para.characterIds,
      location: para.location,
      mood: para.mood
    }));

    const { data: paragraphs, error: paraError } = await supabase
      .from('paragraphs')
      .insert(paragraphsData)
      .select();

    if (paraError) {
      console.error('❌ Paragraphs error:', paraError);
      return NextResponse.json(
        { success: false, error: paraError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Paragraphs saved: ${paragraphs.length}`);

    // 5. Tạo scenes từ paragraphs
    const scenesData = [];
    let sceneNumber = 1;

    for (const para of analysis.paragraphs) {
      if (para.scenes && para.scenes.length > 0) {
        for (const scene of para.scenes) {
          const paragraph = paragraphs.find(p => p.paragraph_number === para.number);

          scenesData.push({
            paragraph_id: paragraph.id,
            chapter_id: chapter.id,
            scene_number: sceneNumber++,
            description: scene.description,
            dialogue: scene.dialogue,
            visual_prompt: scene.visualPrompt,
            negative_prompt: scene.negativePrompt,
            location: scene.location,
            time_of_day: scene.timeOfDay,
            character_ids: scene.characterIds,
            character_prompts: scene.characterPrompts,
            camera_movement: scene.cameraMovement,
            duration: scene.duration,
            motion_intensity: scene.motionIntensity,
            status: 'pending'
          });
        }
      }
    }

    if (scenesData.length > 0) {
      const { error: scenesError } = await supabase
        .from('scenes')
        .insert(scenesData);

      if (scenesError) {
        console.error('❌ Scenes error:', scenesError);
      } else {
        console.log(`✅ Scenes saved: ${scenesData.length}`);
      }
    }

    // 6. Cập nhật total_chapters của series
    const { error: updateError } = await supabase
      .from('series')
      .update({
        total_chapters: (series.total_chapters || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', seriesId);

    if (updateError) {
      console.error('⚠️ Update series error:', updateError);
    }

    console.log('\n🎉 Chapter analysis completed successfully!\n');

    return NextResponse.json({
      success: true,
      chapterId: chapter.id,
      analysis: {
        totalParagraphs: analysis.paragraphs.length,
        totalScenes: analysis.totalScenes,
        characters: analysis.detectedCharacters,
        estimatedDuration: analysis.estimatedDuration
      },
      message: '✅ Phân tích hoàn tất! Đã tạo ' + analysis.totalScenes + ' cảnh với AI-powered prompts.'
    });

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =====================================
// ⭐ HÀM PHÂN TÍCH VĂN BẢN - UPGRADED WITH LLM
// =====================================
async function analyzeChapterWithAI(content, series) {
  console.log('\n🔍 Analyzing chapter with AI...');

  // Tách thành đoạn văn
  const rawParagraphs = content
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  console.log(`📄 Found ${rawParagraphs.length} paragraphs`);

  const paragraphs = [];
  let totalScenes = 0;
  let totalCost = 0;

  // Phân tích từng đoạn VỚI LLM
  for (let i = 0; i < rawParagraphs.length; i++) {
    const paraContent = rawParagraphs[i];

    console.log(`\n[${i + 1}/${rawParagraphs.length}] Analyzing paragraph...`);

    // ⭐ SỬ DỤNG LLM THAY VÌ KEYWORD-BASED
    const aiAnalysis = await analyzeSceneWithLLM(
      paraContent,
      series.genre,
      series.characters || []
    );

    // Track cost
    if (aiAnalysis._metadata?.cost) {
      totalCost += aiAnalysis._metadata.cost;
    }

    // Match characters với database
    const mentionedChars = (series.characters || []).filter(char =>
      aiAnalysis.characters_mentioned?.some(name =>
        name.toLowerCase().includes(char.name.toLowerCase()) ||
        char.name.toLowerCase().includes(name.toLowerCase())
      )
    );

    console.log(`  ✓ Type: ${aiAnalysis.scene_type}`);
    console.log(`  ✓ Characters: ${mentionedChars.length}`);
    console.log(`  ✓ Mood: ${aiAnalysis.mood}`);

    // ⭐ TẠO SCENES VỚI AI-ENHANCED PROMPTS
    const scenes = await createScenesFromParagraphML(
      paraContent,
      aiAnalysis,
      mentionedChars,
      series
    );

    totalScenes += scenes.length;

    paragraphs.push({
      number: i + 1,
      content: paraContent,
      type: aiAnalysis.scene_type,
      characterIds: mentionedChars.map(c => c.id),
      location: aiAnalysis.location,
      mood: aiAnalysis.mood,
      scenes: scenes
    });
  }

  console.log(`\n💰 Total AI cost: $${totalCost.toFixed(4)}`);

  const avgSceneDuration = SCENE_CONFIG.AVG_DURATION_SECONDS;
  const totalSeconds = totalScenes * avgSceneDuration;
  const minutes = Math.ceil(totalSeconds / 60);

  return {
    paragraphs,
    totalScenes,
    estimatedDuration: `${minutes} phút`,
    detectedCharacters: [...new Set(paragraphs.flatMap(p => p.characterIds))],
    totalCost
  };
}

// ⭐ TẠO SCENES VỚI ML-POWERED PROMPTS
async function createScenesFromParagraphML(content, aiAnalysis, characters, series) {
  const scenes = [];
  const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
  const numScenes = Math.max(1, Math.min(
    SCENE_CONFIG.MAX_SCENES_PER_PARAGRAPH,
    Math.ceil(sentences.length / 3)
  ));

  for (let i = 0; i < numScenes; i++) {
    const startIdx = Math.floor(i * sentences.length / numScenes);
    const endIdx = Math.floor((i + 1) * sentences.length / numScenes);
    const sceneContent = sentences.slice(startIdx, endIdx).join('. ') + '.';

    // ⭐ GENERATE ENHANCED PROMPT VỚI LLM
    const { visualPrompt, negativePrompt } = await generateEnhancedPrompt(
      aiAnalysis,
      series.genre,
      characters
    );

    const characterPrompts = {};
    characters.forEach(char => {
      characterPrompts[char.id] = char.appearance_prompt || '';
    });

    scenes.push({
      description: sceneContent.substring(0, 500),
      dialogue: aiAnalysis.scene_type?.includes('dialogue')
        ? extractDialogue(sceneContent)
        : null,
      visualPrompt: visualPrompt,
      negativePrompt: negativePrompt,
      location: aiAnalysis.location,
      timeOfDay: aiAnalysis.time_of_day || 'day',
      characterIds: characters.map(c => c.id),
      characterPrompts: characterPrompts,
      cameraMovement: aiAnalysis.camera_movement || 'static',
      duration: Math.floor(Math.random() *
        (SCENE_CONFIG.MAX_DURATION_SECONDS - SCENE_CONFIG.MIN_DURATION_SECONDS)) +
        SCENE_CONFIG.MIN_DURATION_SECONDS,
      motionIntensity: aiAnalysis.scene_type === 'action' ? 'high' : 'medium'
    });
  }

  return scenes;
}

// Helper function để extract dialogue
function extractDialogue(text) {
  const matches = text.match(/"([^"]+)"|"([^"]+)"|"([^"]+)"/g);
  return matches ? matches.join(' ') : null;
}
