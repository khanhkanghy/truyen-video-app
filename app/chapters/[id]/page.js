'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  BookOpen,
  Film,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Play,
  Edit,
  Sparkles,
  Eye,
  Video,
  AlertCircle,
  Layers
} from 'lucide-react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';

export default function ChapterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.id;
  
  const [chapter, setChapter] = useState(null);
  const [series, setSeries] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  const [scenes, setScenes] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // content, paragraphs, scenes

  useEffect(() => {
    if (chapterId) {
      fetchChapterData();
    }
  }, [chapterId]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chapter info
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select(`
          *,
          series (*)
        `)
        .eq('id', chapterId)
        .single();

      if (chapterError) throw chapterError;
      if (!chapterData) throw new Error('Không tìm thấy chương');

      setChapter(chapterData);
      setSeries(chapterData.series);

      // Fetch paragraphs
      const { data: paragraphsData, error: paragraphsError } = await supabase
        .from('paragraphs')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('paragraph_number', { ascending: true });

      if (paragraphsError) throw paragraphsError;
      setParagraphs(paragraphsData || []);

      // Fetch scenes
      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('scene_number', { ascending: true });

      if (scenesError) throw scenesError;
      setScenes(scenesData || []);

      // Fetch characters của series
      if (chapterData.series?.id) {
        const { data: charactersData } = await supabase
          .from('characters')
          .select('*')
          .eq('series_id', chapterData.series.id)
          .order('name', { ascending: true });
        
        setCharacters(charactersData || []);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Không rõ';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'draft': { bg: 'bg-gray-500/20', text: 'text-gray-300', label: '📝 Nháp' },
      'analyzed': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '🔍 Đã phân tích' },
      'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: '⏳ Chờ xử lý' },
      'generating': { bg: 'bg-purple-500/20', text: 'text-purple-300', label: '🎬 Đang tạo video' },
      'completed': { bg: 'bg-green-500/20', text: 'text-green-300', label: '✅ Hoàn thành' }
    };
    
    const badge = badges[status] || badges['draft'];
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-medium`}>
        {badge.label}
      </span>
    );
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      'peaceful': '😌',
      'tense': '😰',
      'dramatic': '🎭',
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'neutral': '😐'
    };
    return moods[mood] || '😐';
  };

  const getSceneTypeIcon = (type) => {
    switch(type) {
      case 'dialogue': return '💬';
      case 'action': return '⚔️';
      case 'description': return '🖼️';
      default: return '📝';
    }
  };

  // Get character name by ID
  const getCharacterName = (charId) => {
    const char = characters.find(c => c.id === charId);
    return char ? char.name : 'Unknown';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Đang tải thông tin chương..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={fetchChapterData}
          showHomeButton={true}
        />
      </div>
    );
  }

  // Not found
  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 text-white/40" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy chương</h2>
          <Link 
            href="/series"
            className="inline-block mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <ChevronRight size={16} />
            <Link href="/series" className="hover:text-white transition-colors">Bộ truyện</Link>
            <ChevronRight size={16} />
            {series && (
              <>
                <Link href={`/series/${series.id}`} className="hover:text-white transition-colors">
                  {series.title}
                </Link>
                <ChevronRight size={16} />
              </>
            )}
            <span className="text-white">Chương {chapter.chapter_number}</span>
          </div>
        </div>

        {/* Chapter Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">
                  Chương {chapter.chapter_number}
                </span>
                <h1 className="text-3xl font-bold text-white">
                  {chapter.title || `Chương ${chapter.chapter_number}`}
                </h1>
                {getStatusBadge(chapter.status)}
              </div>
              
              {series && (
                <p className="text-white/70 mb-4">
                  Thuộc bộ: <span className="font-semibold">{series.title}</span>
                </p>
              )}

              <div className="flex items-center gap-6 text-white/60 text-sm">
                <span className="flex items-center gap-1">
                  <Layers size={16} />
                  {chapter.total_paragraphs || 0} đoạn
                </span>
                <span className="flex items-center gap-1">
                  <Film size={16} />
                  {chapter.total_scenes || scenes.length} cảnh
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {chapter.estimated_duration || '0 phút'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {characters.length} nhân vật
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Link
                href={`/chapters/${chapterId}/scenes`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Film size={18} />
                <span>Quản lý cảnh</span>
              </Link>
              <button
                onClick={() => alert('Tính năng tạo video đang phát triển')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Video size={18} />
                <span>Tạo video</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/20 pb-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'content' 
                  ? 'text-white border-b-2 border-purple-500' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📖 Nội dung
            </button>
            <button
              onClick={() => setActiveTab('paragraphs')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'paragraphs' 
                  ? 'text-white border-b-2 border-purple-500' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📝 Đoạn văn ({paragraphs.length})
            </button>
            <button
              onClick={() => setActiveTab('scenes')}
              className={`px-4 py-2 transition-all ${
                activeTab === 'scenes' 
                  ? 'text-white border-b-2 border-purple-500' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🎬 Cảnh phim ({scenes.length})
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'content' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📖 Nội dung chương</h2>
            <div className="prose prose-invert max-w-none">
              <div className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg">
                {chapter.content || 'Chưa có nội dung'}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'paragraphs' && (
          <div className="space-y-4">
            {paragraphs.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                <Layers className="mx-auto mb-4 text-white/40" size={64} />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Chưa phân tích đoạn văn
                </h3>
                <p className="text-white/60">
                  Chương này chưa được phân tích thành các đoạn văn
                </p>
              </div>
            ) : (
              paragraphs.map((paragraph, index) => (
                <div 
                  key={paragraph.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">{paragraph.paragraph_number}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-lg font-semibold text-white">
                          Đoạn {paragraph.paragraph_number}
                        </span>
                        <span className="text-2xl">{getSceneTypeIcon(paragraph.scene_type)}</span>
                        <span className="text-2xl">{getMoodEmoji(paragraph.mood)}</span>
                      </div>

                      <p className="text-white/80 mb-4 whitespace-pre-wrap">
                        {paragraph.content}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {paragraph.location && (
                          <div className="flex items-center gap-1 text-white/60">
                            <MapPin size={14} />
                            <span>{paragraph.location}</span>
                          </div>
                        )}
                        
                        {paragraph.mentioned_characters && paragraph.mentioned_characters.length > 0 && (
                          <div className="flex items-center gap-1 text-white/60">
                            <Users size={14} />
                            <span>{paragraph.mentioned_characters.map(id => getCharacterName(id)).join(', ')}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-white/60">
                          <span className="px-2 py-0.5 bg-white/10 rounded">
                            {paragraph.scene_type || 'description'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-white/60">
                          <span className="px-2 py-0.5 bg-white/10 rounded">
                            {paragraph.mood || 'neutral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="space-y-4">
            {scenes.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
                <Film className="mx-auto mb-4 text-white/40" size={64} />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Chưa có cảnh nào
                </h3>
                <p className="text-white/60 mb-6">
                  Chương này chưa được tạo cảnh phim
                </p>
                <Link
                  href={`/chapters/${chapterId}/scenes`}
                  className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
                >
                  Quản lý cảnh
                </Link>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">🎬 Danh sách cảnh</h2>
                  <Link
                    href={`/chapters/${chapterId}/scenes`}
                    className="text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    Quản lý chi tiết →
                  </Link>
                </div>
                
                {scenes.map((scene) => (
                  <div 
                    key={scene.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Scene number */}
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{scene.scene_number}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-white">
                            Cảnh {scene.scene_number}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(scene.status)}
                            <span className="text-white/60 text-sm">
                              {scene.duration}s
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-white/80 mb-4">
                          {scene.description}
                        </p>

                        {/* Dialogue */}
                        {scene.dialogue && (
                          <div className="bg-white/5 rounded-lg p-3 mb-4">
                            <p className="text-white/60 text-sm mb-1">💬 Lời thoại:</p>
                            <p className="text-white/90 italic">"{scene.dialogue}"</p>
                          </div>
                        )}

                        {/* Visual Prompt */}
                        <div className="bg-white/5 rounded-lg p-3 mb-4">
                          <p className="text-white/60 text-sm mb-1">🎨 Visual Prompt:</p>
                          <p className="text-white/70 text-sm">
                            {scene.visual_prompt || 'Chưa có prompt'}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {scene.location && (
                            <div className="flex items-center gap-1 text-white/60">
                              <MapPin size={14} />
                              <span>{scene.location}</span>
                            </div>
                          )}
                          
                          {scene.character_ids && scene.character_ids.length > 0 && (
                            <div className="flex items-center gap-1 text-white/60">
                              <Users size={14} />
                              <span>{scene.character_ids.length} nhân vật</span>
                            </div>
                          )}
                          
                          {scene.camera_movement && (
                            <div className="flex items-center gap-1 text-white/60">
                              <Video size={14} />
                              <span>{scene.camera_movement}</span>
                            </div>
                          )}
                          
                          {scene.motion_intensity && (
                            <div className="flex items-center gap-1 text-white/60">
                              <Sparkles size={14} />
                              <span>{scene.motion_intensity}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4">
                          <Link
                            href={`/chapters/${chapterId}/scenes#scene-${scene.id}`}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                          >
                            <Edit size={14} />
                            <span>Chỉnh sửa</span>
                          </Link>
                          
                          {scene.status !== 'completed' && (
                            <button
                              onClick={() => alert('Tính năng tạo video đang phát triển')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                            >
                              <Play size={14} />
                              <span>Tạo video</span>
                            </button>
                          )}
                          
                          {scene.video_url && (
                            <a
                              href={scene.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                            >
                              <Eye size={14} />
                              <span>Xem video</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-white font-semibold mb-2">💡 Thông tin</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Mỗi đoạn văn sẽ được AI phân tích thành 1 hoặc nhiều cảnh</li>
                <li>• Visual prompt được tạo tự động dựa trên nội dung và nhân vật</li>
                <li>• Có thể chỉnh sửa prompt trước khi tạo video</li>
                <li>• Thời lượng mỗi cảnh thường từ 5-30 giây</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}