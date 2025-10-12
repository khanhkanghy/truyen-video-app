import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { seriesId, chapterNumber, title, content } = await request.json();

    if (!seriesId || !content) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin' },
        { status: 400 }
      );
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
      console.error('Series error:', seriesError);
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bộ truyện' },
        { status: 404 }
      );
    }

    // 2. Phân tích văn bản
    const analysis = await analyzeChapterWithAI(content, series);

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
      console.error('Chapter error:', chapterError);
      return NextResponse.json(
        { success: false, error: chapterError.message },
        { status: 500 }
      );
    }

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
      console.error('Paragraphs error:', paraError);
      return NextResponse.json(
        { success: false, error: paraError.message },
        { status: 500 }
      );
    }

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
        console.error('Scenes error:', scenesError);
      }
    }

    // 6. Cập nhật total_chapters của series
    const { error: updateError } = await supabase
      .from('series')
      .update({ total_chapters: (series.total_chapters || 0) + 1 })
      .eq('id', seriesId);

    if (updateError) {
      console.error('Update series error:', updateError);
    }

    return NextResponse.json({
      success: true,
      chapterId: chapter.id,
      analysis: {
        totalParagraphs: analysis.paragraphs.length,
        totalScenes: analysis.totalScenes,
        characters: analysis.detectedCharacters,
        estimatedDuration: analysis.estimatedDuration
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// =====================================
// HÀM PHÂN TÍCH VĂN BẢN
// =====================================
async function analyzeChapterWithAI(content, series) {
  // Tách thành đoạn văn
  const rawParagraphs = content
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const paragraphs = [];
  let totalScenes = 0;

  // Phân tích từng đoạn
  for (let i = 0; i < rawParagraphs.length; i++) {
    const paraContent = rawParagraphs[i];
    
    const sceneType = detectSceneType(paraContent);
    const mentionedChars = detectCharacters(paraContent, series.characters || []);
    const location = detectLocation(paraContent);
    const mood = detectMood(paraContent);

    const scenes = createScenesFromParagraph(
      paraContent,
      sceneType,
      mentionedChars,
      location,
      series
    );

    totalScenes += scenes.length;

    paragraphs.push({
      number: i + 1,
      content: paraContent,
      type: sceneType,
      characterIds: mentionedChars.map(c => c.id),
      location: location,
      mood: mood,
      scenes: scenes
    });
  }

  const avgSceneDuration = 15;
  const totalSeconds = totalScenes * avgSceneDuration;
  const minutes = Math.ceil(totalSeconds / 60);

  return {
    paragraphs,
    totalScenes,
    estimatedDuration: `${minutes} phút`,
    detectedCharacters: [...new Set(paragraphs.flatMap(p => p.characterIds))]
  };
}

function detectSceneType(text) {
  const lowerText = text.toLowerCase();
  
  if (text.includes('"') || text.includes('"') || text.includes('"')) {
    return 'dialogue';
  }
  
  const actionKeywords = ['chiến', 'đánh', 'bay', 'nhảy', 'chạy', 'tấn công'];
  if (actionKeywords.some(kw => lowerText.includes(kw))) {
    return 'action';
  }
  
  return 'description';
}

function detectCharacters(text, characters) {
  const mentioned = [];
  
  for (const char of characters) {
    const nameParts = char.name.split(' ');
    
    if (text.includes(char.name)) {
      mentioned.push(char);
      continue;
    }
    
    if (nameParts.length >= 2) {
      const shortName = nameParts.slice(-2).join(' ');
      if (text.includes(shortName)) {
        mentioned.push(char);
      }
    }
  }
  
  return mentioned;
}

function detectLocation(text) {
  const locations = {
    'núi': 'Mountain peak',
    'rừng': 'Dense forest',
    'động': 'Cave',
    'thành': 'Ancient city',
    'cung điện': 'Palace hall',
    'làng': 'Village'
  };
  
  const lowerText = text.toLowerCase();
  for (const [keyword, location] of Object.entries(locations)) {
    if (lowerText.includes(keyword)) {
      return location;
    }
  }
  
  return 'Unspecified location';
}

function detectMood(text) {
  const moods = {
    'tense': ['căng thẳng', 'nguy hiểm', 'lo lắng'],
    'peaceful': ['yên bình', 'thanh tịnh', 'tĩnh lặng'],
    'dramatic': ['kịch tính', 'bùng nổ', 'dữ dội']
  };
  
  const lowerText = text.toLowerCase();
  for (const [mood, keywords] of Object.entries(moods)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return mood;
    }
  }
  
  return 'neutral';
}

function createScenesFromParagraph(content, sceneType, characters, location, series) {
  const scenes = [];
  const sentences = content.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
  const numScenes = Math.max(1, Math.min(3, Math.ceil(sentences.length / 3)));
  
  for (let i = 0; i < numScenes; i++) {
    const startIdx = Math.floor(i * sentences.length / numScenes);
    const endIdx = Math.floor((i + 1) * sentences.length / numScenes);
    const sceneContent = sentences.slice(startIdx, endIdx).join('. ') + '.';
    
    const visualPrompt = buildVisualPrompt(
      sceneContent,
      sceneType,
      characters,
      location,
      series.genre
    );
    
    const characterPrompts = {};
    characters.forEach(char => {
      characterPrompts[char.id] = char.appearance_prompt || '';
    });
    
    scenes.push({
      description: sceneContent.substring(0, 500),
      dialogue: sceneType === 'dialogue' ? extractDialogue(sceneContent) : null,
      visualPrompt: visualPrompt,
      negativePrompt: 'blurry, low quality, distorted faces',
      location: location,
      timeOfDay: 'day',
      characterIds: characters.map(c => c.id),
      characterPrompts: characterPrompts,
      cameraMovement: sceneType === 'action' ? 'dynamic' : 'static',
      duration: Math.floor(Math.random() * 10) + 10,
      motionIntensity: sceneType === 'action' ? 'high' : 'medium'
    });
  }
  
  return scenes;
}

function buildVisualPrompt(content, sceneType, characters, location, genre) {
  let prompt = 'cinematic style, ';
  
  if (characters.length > 0) {
    prompt += characters.map(c => c.appearance_prompt || c.name).join(', ') + ', ';
  }
  
  prompt += `${location}, `;
  
  if (sceneType === 'action') {
    prompt += 'dynamic action, ';
  }
  
  prompt += 'high quality, detailed, 4k';
  
  return prompt;
}

function extractDialogue(text) {
  const matches = text.match(/"([^"]+)"/g);
  return matches ? matches.join(' ') : null;
}