/**
 * 🎬 DIRECTOR MODE - Chapter Analysis API
 * Phân tích chapter như một đạo diễn/biên kịch phim chuyên nghiệp
 *
 * KHÁC BIỆT VỚI /analyze:
 * - Không split theo \n\n (xuống dòng)
 * - LLM tự phân tích và chia scenes theo logic kịch bản
 * - Scenes được tạo dựa trên thay đổi địa điểm/nhân vật/hành động
 * - Chi tiết hơn, chuyên nghiệp hơn, giống shot list thật
 * - Hỗ trợ user custom prompt
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { analyzeChapterAsDirector } from '@/lib/ai';

export async function POST(request) {
  try {
    const {
      seriesId,
      chapterNumber,
      title,
      content,
      userPrompt // ⭐ NEW: User có thể thêm yêu cầu tùy chỉnh
    } = await request.json();

    if (!seriesId || !content) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin: seriesId và content là bắt buộc' },
        { status: 400 }
      );
    }

    console.log('\n🎬 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 DIRECTOR MODE - AI-Powered Chapter Analysis');
    console.log('🎬 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📚 Series ID: ${seriesId}`);
    console.log(`📖 Chapter: ${chapterNumber || 'Auto'}`);
    console.log(`📝 Content length: ${content.length} characters`);
    if (userPrompt) {
      console.log(`👤 User custom prompt: "${userPrompt}"`);
    }

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

    console.log(`✅ Series loaded: "${series.title}" (${series.genre})`);
    console.log(`👥 Characters: ${series.characters?.length || 0}`);

    // 2. ⭐ PHÂN TÍCH VỚI DIRECTOR MODE
    console.log('\n🎬 Starting director analysis...');
    const directorAnalysis = await analyzeChapterAsDirector(
      content,
      series.genre,
      series.characters || [],
      userPrompt || ''
    );

    console.log('\n📊 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIRECTOR ANALYSIS RESULTS:');
    console.log('📊 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   🎬 Total scenes: ${directorAnalysis.total_scenes}`);
    console.log(`   ⏱️  Estimated duration: ${directorAnalysis.estimated_duration}`);
    console.log(`   📖 Story summary: ${directorAnalysis.story_summary}`);
    console.log(`   💰 AI cost: $${directorAnalysis._metadata?.cost.toFixed(4)}`);
    console.log(`   🤖 Model: ${directorAnalysis._metadata?.model}`);
    console.log(`   🎟️  Tokens used: ${directorAnalysis._metadata?.tokens}`);

    // 3. Lưu chapter vào database
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .insert([{
        series_id: seriesId,
        chapter_number: chapterNumber || (series.total_chapters || 0) + 1,
        title: title || `Chương ${chapterNumber || (series.total_chapters || 0) + 1}`,
        content: content,
        total_paragraphs: 0, // Không dùng paragraphs nữa
        total_scenes: directorAnalysis.total_scenes,
        estimated_duration: directorAnalysis.estimated_duration,
        status: 'analyzed'
      }])
      .select()
      .single();

    if (chapterError) {
      console.error('❌ Chapter save error:', chapterError);
      return NextResponse.json(
        { success: false, error: chapterError.message },
        { status: 500 }
      );
    }

    console.log(`\n✅ Chapter saved: ${chapter.id}`);

    // 4. ⭐ LƯU SCENES (Không cần paragraphs)
    const scenesData = directorAnalysis.scenes.map(scene => {
      // Extract character IDs
      const characterIds = scene.characters
        ?.map(char => {
          const foundChar = series.characters?.find(c =>
            c.name.toLowerCase().includes(char.name.toLowerCase()) ||
            char.name.toLowerCase().includes(c.name.toLowerCase())
          );
          return foundChar?.id;
        })
        .filter(Boolean) || [];

      // Build visual prompt from scene data
      const visualPrompt = scene.visual_description || scene.action_description || '';

      // Build character prompts
      const characterPrompts = {};
      characterIds.forEach(charId => {
        const char = series.characters?.find(c => c.id === charId);
        if (char?.appearance_prompt) {
          characterPrompts[charId] = char.appearance_prompt;
        }
      });

      return {
        chapter_id: chapter.id,
        paragraph_id: null, // Không dùng paragraphs
        scene_number: scene.scene_number,

        // Basic info
        description: scene.action_description?.substring(0, 500) || scene.scene_title,
        dialogue: scene.characters?.map(c => c.dialogue).filter(Boolean).join('\n') || null,

        // Visual
        visual_prompt: visualPrompt,
        negative_prompt: 'blurry, low quality, low resolution, distorted, deformed, ugly',

        // Location & Time
        location: scene.location?.name || 'Unspecified',
        time_of_day: scene.location?.time_of_day || 'day',

        // Characters
        character_ids: characterIds,
        character_prompts: characterPrompts,

        // Camera
        camera_movement: scene.camera?.camera_movement || 'static',

        // Duration & Mood
        duration: scene.duration_seconds || 15,
        motion_intensity: scene.mood_and_tone?.pacing === 'fast' ? 'high' : 'medium',

        status: 'pending'
      };
    });

    if (scenesData.length > 0) {
      const { error: scenesError } = await supabase
        .from('scenes')
        .insert(scenesData);

      if (scenesError) {
        console.error('❌ Scenes save error:', scenesError);
        return NextResponse.json(
          { success: false, error: scenesError.message },
          { status: 500 }
        );
      }

      console.log(`✅ Scenes saved: ${scenesData.length}`);
    }

    // 5. Cập nhật series
    await supabase
      .from('series')
      .update({
        total_chapters: (series.total_chapters || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', seriesId);

    console.log('\n🎉 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DIRECTOR MODE ANALYSIS COMPLETED!');
    console.log('🎉 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json({
      success: true,
      chapterId: chapter.id,
      analysis: {
        mode: 'director', // ⭐ Đánh dấu mode
        total_scenes: directorAnalysis.total_scenes,
        estimated_duration: directorAnalysis.estimated_duration,
        story_summary: directorAnalysis.story_summary,
        cost: directorAnalysis._metadata?.cost,
        model: directorAnalysis._metadata?.model,
        user_prompt: userPrompt || null,
      },
      scenes: directorAnalysis.scenes, // ⭐ Trả về full scenes để frontend hiển thị
      message: `✅ Phân tích hoàn tất! AI đạo diễn đã tạo ${directorAnalysis.total_scenes} cảnh chuyên nghiệp.`
    });

  } catch (error) {
    console.error('\n❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ CRITICAL ERROR:');
    console.error('❌ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
