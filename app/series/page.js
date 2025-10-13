'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit, Film, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';

export default function SeriesManagePage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSeries: 0,
    totalChapters: 0,
    activeSeries: 0
  });

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy danh sách series
      const { data, error: fetchError } = await supabase
        .from('series')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Nếu không có data
      if (!data) {
        setSeries([]);
        setStats({
          totalSeries: 0,
          totalChapters: 0,
          activeSeries: 0
        });
        return;
      }

      // Đếm số chapters cho mỗi series (optimized query)
      const seriesIds = data.map(s => s.id);
      
      if (seriesIds.length > 0) {
        const { data: chaptersCount } = await supabase
          .from('chapters')
          .select('series_id')
          .in('series_id', seriesIds);

        // Đếm chapters cho mỗi series
        const chapterCountMap = {};
        if (chaptersCount) {
          chaptersCount.forEach(ch => {
            chapterCountMap[ch.series_id] = (chapterCountMap[ch.series_id] || 0) + 1;
          });
        }

        // Gắn số chapters vào mỗi series
        const seriesWithStats = data.map(item => ({
          ...item,
          chapters_count: chapterCountMap[item.id] || 0
        }));

        setSeries(seriesWithStats);
        
        // Tính stats
        setStats({
          totalSeries: seriesWithStats.length,
          totalChapters: Object.values(chapterCountMap).reduce((sum, count) => sum + count, 0),
          activeSeries: seriesWithStats.filter(s => s.status === 'active').length
        });
      } else {
        setSeries([]);
        setStats({
          totalSeries: 0,
          totalChapters: 0,
          activeSeries: 0
        });
      }

    } catch (err) {
      console.error('Error fetching series:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Không rõ';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Đang tải danh sách bộ truyện..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={fetchSeries}
          showHomeButton={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Quay lại trang chủ</span>
          </Link>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                📚 Quản lý Bộ Truyện
              </h1>
              <p className="text-purple-200">
                Tổng cộng {stats.totalSeries} bộ truyện
              </p>
            </div>
            <Link
              href="/upload"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Thêm chương mới</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Tổng bộ truyện</p>
                <p className="text-3xl font-bold text-white">{stats.totalSeries}</p>
              </div>
              <BookOpen className="text-purple-400" size={40} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Tổng chương</p>
                <p className="text-3xl font-bold text-white">{stats.totalChapters}</p>
              </div>
              <Film className="text-blue-400" size={40} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Đang hoạt động</p>
                <p className="text-3xl font-bold text-white">{stats.activeSeries}</p>
              </div>
              <Film className="text-green-400" size={40} />
            </div>
          </div>
        </div>

        {/* Series List */}
        {series.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
            <BookOpen className="mx-auto mb-4 text-white/40" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">
              Chưa có bộ truyện nào
            </h3>
            <p className="text-white/60 mb-6">
              Bắt đầu bằng cách upload chương đầu tiên!
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
            >
              Upload ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all group hover:transform hover:scale-105"
              >
                {/* Cover Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {item.cover_image ? (
                    <img 
                      src={item.cover_image} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="text-white/30" size={64} />
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                
                {/* Description */}
                <p className="text-white/70 mb-4 line-clamp-2 text-sm min-h-[40px]">
                  {item.description || 'Chưa có mô tả'}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-medium">
                    {item.genre}
                  </span>
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <Film size={14} />
                    {item.chapters_count} chương
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    item.status === 'active' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {item.status === 'active' ? '🟢 Hoạt động' : '⏸️ Tạm dừng'}
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-white/40 mb-4">
                  Tạo: {formatDate(item.created_at)}
                </p>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Link
                    href={`/series/${item.id}`}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-center text-sm font-medium flex items-center justify-center gap-2 shadow hover:shadow-lg"
                  >
                    <Film size={16} />
                    Xem chương & cảnh
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/series/${item.id}/characters`}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-center text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Users size={14} />
                      Nhân vật
                    </Link>
                    <Link
                      href={`/series/${item.id}/edit`}
                      className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all text-center text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Edit size={14} />
                      Sửa
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-white font-semibold mb-2">💡 Mẹo sử dụng</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Mỗi bộ truyện có thể có nhiều chương</li>
                <li>• Mỗi chương sẽ được AI phân tích thành các cảnh</li>
                <li>• Nhấn vào "Nhân vật" để quản lý các character của truyện</li>
                <li>• Trạng thái "Hoạt động" nghĩa là đang trong quá trình sản xuất</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}