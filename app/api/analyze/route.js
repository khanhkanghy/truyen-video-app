import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { content, title } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Thiếu nội dung văn bản' },
        { status: 400 }
      );
    }

    // Phân tích văn bản đơn giản (sẽ nâng cấp bằng AI sau)
    const analysis = analyzeStory(content);

    // Lưu vào database
    const { data: story, error } = await supabase
      .from('stories')
      .insert([
        {
          title: title || 'Chưa đặt tên',
          content: content,
          genre: analysis.genre,
          total_scenes: analysis.totalScenes,
          estimated_duration: analysis.estimatedDuration,
          status: 'analyzed'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Lưu từng cảnh
    const scenesData = analysis.scenes.map((scene, index) => ({
      story_id: story.id,
      scene_number: index + 1,
      description: scene.description,
      characters: scene.characters,
      location: scene.location,
      actions: scene.actions,
      duration: scene.duration
    }));

    const { error: scenesError } = await supabase
      .from('scenes')
      .insert(scenesData);

    if (scenesError) throw scenesError;

    return NextResponse.json({
      success: true,
      storyId: story.id,
      analysis: analysis
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Hàm phân tích văn bản đơn giản
function analyzeStory(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const wordCount = content.split(/\s+/).length;
  
  // Phát hiện thể loại đơn giản
  const genre = detectGenre(content);
  
  // Ước tính số cảnh (mỗi đoạn văn = 1 cảnh)
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const totalScenes = Math.max(paragraphs.length, Math.floor(wordCount / 200));
  
  // Phát hiện nhân vật (tên riêng viết hoa)
  const characterMatches = content.match(/[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)*/g);
  const uniqueCharacters = [...new Set(characterMatches || [])].slice(0, 5);
  
  // Tạo scenes
  const scenes = paragraphs.slice(0, 5).map((para, index) => ({
    description: para.substring(0, 200) + '...',
    characters: uniqueCharacters.slice(0, 2),
    location: detectLocation(para),
    actions: detectActions(para),
    duration: Math.floor(Math.random() * 20) + 10 // 10-30s mỗi cảnh
  }));
  
  return {
    totalScenes,
    characters: uniqueCharacters,
    genre,
    estimatedDuration: `${Math.ceil(totalScenes * 20 / 60)} phút`,
    wordCount,
    scenes
  };
}

function detectGenre(text) {
  const keywords = {
    'tiên hiệp': ['tu tiên', 'linh khí', 'pháp thuật', 'đan dược', 'tông môn'],
    'huyền huyễn': ['dị giới', 'ma pháp', 'rồng', 'kỵ sĩ'],
    'kiếm hiệp': ['võ lâm', 'kiếm pháp', 'nội công', 'giang hồ'],
    'hiện đại': ['thành phố', 'công ty', 'điện thoại', 'ô tô'],
    'lãng mạn': ['yêu', 'thương', 'trái tim', 'hôn']
  };
  
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedGenre = 'Tổng hợp';
  
  for (const [genre, words] of Object.entries(keywords)) {
    const score = words.filter(word => lowerText.includes(word)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedGenre = genre;
    }
  }
  
  return detectedGenre;
}

function detectLocation(text) {
  const locations = ['núi', 'rừng', 'thành phố', 'làng', 'cung điện', 'động', 'đình'];
  const found = locations.find(loc => text.toLowerCase().includes(loc));
  return found || 'Không xác định';
}

function detectActions(text) {
  const actions = ['chiến đấu', 'bay', 'chạy', 'nói chuyện', 'suy nghĩ'];
  const found = actions.find(action => text.toLowerCase().includes(action));
  return found || 'Hành động thường';
}