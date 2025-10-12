'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit, Film, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; // ← THÊM DÒNG NÀY

export default function SeriesManagePage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Đếm số chapters cho mỗi series
      const seriesWithStats = await Promise.all(
        (data || []).map(async (item) => {
          const { count } = await supabase
            .from('chapters')
            .select('*', { count: 'exact', head: true })
            .eq('series_id', item.id);
          
          return { ...item, chapters_count: count || 0 };
        })
      );

      setSeries(seriesWithStats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Đang tải...</p>
        </div>
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
                Tổng cộng {series.length} bộ truyện
              </p>
            </div>
            <Link
              href="/upload"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 font-semibold"
            >
              <Plus size={20} />
              <span>Thêm chương mới</span>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Tổng bộ truyện</p>
                <p className="text-3xl font-bold text-white">{series.length}</p>
              </div>
              <BookOpen className="text-purple-400" size={40} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Tổng chương</p>
                <p className="text-3xl font-bold text-white">
                  {series.reduce((sum, s) => sum + s.chapters_count, 0)}
                </p>
              </div>
              <Film className="text-blue-400" size={40} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm mb-1">Đang hoạt động</p>
                <p className="text-3xl font-bold text-white">
                  {series.filter(s => s.status === 'active').length}
                </p>
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
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Upload ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all group"
              >
                {/* Cover Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="text-white/30" size={64} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {item.title}
                </h3>
                
                {/* Description */}
                <p className="text-white/70 mb-4 line-clamp-2 text-sm">
                  {item.description || 'Chưa có mô tả'}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
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
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all text-center text-sm font-medium flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}