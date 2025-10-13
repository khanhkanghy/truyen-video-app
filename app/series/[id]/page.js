'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Film, 
  Users, 
  Edit, 
  Plus, 
  Calendar,
  Clock,
  Eye,
  Trash2,
  AlertCircle,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id;
  
  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);

  useEffect(() => {
    if (seriesId) {
      fetchSeriesData();
    }
  }, [seriesId]);

  const fetchSeriesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch series info
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .eq('id', seriesId)
        .single();

      if (seriesError) throw seriesError;
      if (!seriesData) throw new Error('Không tìm thấy bộ truyện');

      setSeries(seriesData);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*, paragraphs(count), scenes(count)')
        .eq('series_id', seriesId)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;
      
      // Process chapters với counts
      const processedChapters = (chaptersData || []).map(chapter => ({
        ...chapter,
        paragraphs_count: chapter.paragraphs?.[0]?.count || 0,
        scenes_count: chapter.scenes?.[0]?.count || 0
      }));
      
      setChapters(processedChapters);

      // Fetch characters
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('series_id', seriesId)
        .order('created_at', { ascending: false });

      if (charactersError) throw charactersError;
      setCharacters(charactersData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('Bạn có chắc muốn xóa chương này? Tất cả cảnh và dữ liệu liên quan sẽ bị xóa!')) {
      return;
    }

    try {
      setDeletingChapter(chapterId);
      
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      // Update local state
      setChapters(chapters.filter(ch => ch.id !== chapterId));
      
      // Update series total_chapters
      await supabase
        .from('series')
        .update({ 
          total_chapters: chapters.length - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', seriesId);

      alert('✅ Đã xóa chương thành công');
    } catch (err) {
      console.error('Error deleting chapter:', err);
      alert('❌ Lỗi khi xóa chương: ' + err.message);
    } finally {
      setDeletingChapter(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
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
      'generating': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: '⚙️ Đang xử lý' },
      'completed': { bg: 'bg-green-500/20', text: 'text-green-300', label: '✅ Hoàn thành' }
    };
    
    const badge = badges[status] || badges['draft'];
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} rounded-full text-xs font-medium`}>
        {badge.label}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Đang tải thông tin bộ truyện..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={fetchSeriesData}
          showHomeButton={true}
        />
      </div>
    );
  }

  // Not found
  if (!series) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 text-white/40" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">Không tìm thấy bộ truyện</h2>
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
            <span className="text-white">{series.title}</span>
          </div>
        </div>

        {/* Series Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{series.title}</h1>
              <p className="text-white/70 text-lg mb-4">
                {series.description || 'Chưa có mô tả'}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-full font-medium">
                  {series.genre}
                </span>
                <span className={`px-4 py-2 rounded-full font-medium ${
                  series.status === 'active' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {series.status === 'active' ? '🟢 Đang hoạt động' : '⏸️ Tạm dừng'}
                </span>
                <span className="text-white/60 text-sm">
                  Tạo: {formatDate(series.created_at)}
                </span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Link
                href={`/series/${seriesId}/characters`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Users size={18} />
                <span>Nhân vật ({characters.length})</span>
              </Link>
              <Link
                href={`/series/${seriesId}/edit`}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Edit size={18} />
                <span>Sửa</span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{chapters.length}</p>
              <p className="text-white/60 text-sm">Chương</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {chapters.reduce((sum, ch) => sum + (ch.scenes_count || 0), 0)}
              </p>
              <p className="text-white/60 text-sm">Cảnh</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{characters.length}</p>
              <p className="text-white/60 text-sm">Nhân vật</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                {chapters.reduce((sum, ch) => {
                  const duration = parseInt(ch.estimated_duration) || 0;
                  return sum + duration;
                }, 0)} phút
              </p>
              <p className="text-white/60 text-sm">Tổng thời lượng</p>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">📚 Danh sách chương</h2>
            <Link
              href="/upload"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              <span>Thêm chương mới</span>
            </Link>
          </div>

          {chapters.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
              <BookOpen className="mx-auto mb-4 text-white/40" size={64} />
              <h3 className="text-2xl font-bold text-white mb-2">
                Chưa có chương nào
              </h3>
              <p className="text-white/60 mb-6">
                Bắt đầu bằng cách thêm chương đầu tiên
              </p>
              <Link
                href="/upload"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
              >
                Upload chương đầu tiên
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div 
                  key={chapter.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-sm">
                          Chương {chapter.chapter_number}
                        </span>
                        <h3 className="text-xl font-bold text-white">
                          {chapter.title || `Chương ${chapter.chapter_number}`}
                        </h3>
                        {getStatusBadge(chapter.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-white/70">
                          <Film size={16} />
                          <span className="text-sm">{chapter.total_paragraphs || 0} đoạn</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Eye size={16} />
                          <span className="text-sm">{chapter.scenes_count || 0} cảnh</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock size={16} />
                          <span className="text-sm">{chapter.estimated_duration || '0 phút'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar size={16} />
                          <span className="text-sm">{formatDate(chapter.created_at)}</span>
                        </div>
                      </div>

                      {/* Preview content */}
                      {chapter.content && (
                        <p className="text-white/60 text-sm line-clamp-2 mb-4">
                          {chapter.content.substring(0, 200)}...
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <Link
                          href={`/chapters/${chapter.id}`}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                        >
                          <Eye size={16} />
                          <span>Xem chi tiết</span>
                        </Link>
                        <Link
                          href={`/chapters/${chapter.id}/scenes`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                        >
                          <Film size={16} />
                          <span>Quản lý cảnh</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteChapter(chapter.id)}
                          disabled={deletingChapter === chapter.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          {deletingChapter === chapter.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Đang xóa...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} />
                              <span>Xóa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Characters Preview */}
        {characters.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">👥 Nhân vật chính</h3>
              <Link
                href={`/series/${seriesId}/characters`}
                className="text-purple-300 hover:text-purple-200 transition-colors text-sm"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.slice(0, 4).map((char) => (
                <div key={char.id} className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {char.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-white font-medium">{char.name}</p>
                  <p className="text-white/60 text-xs">{char.role || 'Nhân vật'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-white font-semibold mb-2">💡 Hướng dẫn</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Nhấn "Xem chi tiết" để xem các cảnh của từng chương</li>
                <li>• Nhấn "Quản lý cảnh" để chỉnh sửa prompt và tạo video</li>
                <li>• Nhấn "Nhân vật" để thêm ảnh reference cho nhân vật</li>
                <li>• Mỗi chương có thể có nhiều cảnh được AI tự động tạo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}