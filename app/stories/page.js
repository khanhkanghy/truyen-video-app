'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Clock, Film, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: '⏳ Chờ xử lý' },
      analyzed: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: '🔍 Đã phân tích' },
      generating: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: '🎬 Đang tạo video' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-300', label: '✅ Hoàn thành' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
        {config.label}
      </span>
    );
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
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </Link>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 Kho Truyện
          </h1>
          <p className="text-purple-200">
            Quản lý và xem tất cả truyện đã phân tích
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Tổng truyện</p>
                <p className="text-3xl font-bold text-white">{stories.length}</p>
              </div>
              <BookOpen className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Đã phân tích</p>
                <p className="text-3xl font-bold text-white">
                  {stories.filter(s => s.status === 'analyzed').length}
                </p>
              </div>
              <Film className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Tổng cảnh</p>
                <p className="text-3xl font-bold text-white">
                  {stories.reduce((sum, s) => sum + (s.total_scenes || 0), 0)}
                </p>
              </div>
              <Clock className="text-green-400" size={32} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Hoàn thành</p>
                <p className="text-3xl font-bold text-white">
                  {stories.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <Film className="text-pink-400" size={32} />
            </div>
          </div>
        </div>

        {/* Stories List */}
        {stories.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
            <BookOpen className="mx-auto mb-4 text-white/40" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">Chưa có truyện nào</h3>
            <p className="text-white/60 mb-6">Hãy bắt đầu bằng cách upload văn bản truyện đầu tiên!</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Upload truyện ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all hover:scale-105 cursor-pointer h-full">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {story.title}
                  </h3>

                  {/* Status */}
                  <div className="mb-4">
                    {getStatusBadge(story.status)}
                  </div>

                  {/* Content Preview */}
                  <p className="text-white/60 text-sm mb-4 line-clamp-3">
                    {story.content?.substring(0, 150)}...
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-purple-200">
                      <Film size={16} />
                      <span>{story.total_scenes || 0} cảnh</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                      <Clock size={16} />
                      <span>{story.estimated_duration || 'Chưa xác định'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-200">
                      <BookOpen size={16} />
                      <span>{story.genre || 'Chưa phân loại'}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-white/40 border-t border-white/10 pt-3">
                    {formatDate(story.created_at)}
                  </div>

                  {/* View Button */}
                  <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-purple-600/30 group-hover:bg-purple-600 rounded-lg transition-all">
                    <Eye size={16} className="text-white" />
                    <span className="text-white font-medium text-sm">Xem chi tiết</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}