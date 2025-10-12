'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Film, MapPin, Users, Play, Download } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function StoryDetailPage() {
  const params = useParams();
  const [story, setStory] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStoryDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchStoryDetail = async () => {
    try {
      // Fetch story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', params.id)
        .single();

      if (storyError) throw storyError;
      setStory(storyData);

      // Fetch scenes
      const { data: scenesData, error: scenesError } = await supabase
        .from('scenes')
        .select('*')
        .eq('story_id', params.id)
        .order('scene_number', { ascending: true });

      if (scenesError) throw scenesError;
      setScenes(scenesData || []);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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

  if (!story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Không tìm thấy truyện</p>
          <Link href="/stories" className="text-purple-300 hover:text-purple-200 mt-4 inline-block">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/stories" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách</span>
        </Link>

        {/* Story Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {story.title}
          </h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <span className="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-full text-sm font-medium">
              📚 {story.genre}
            </span>
            <span className="px-4 py-2 bg-blue-500/30 text-blue-200 rounded-full text-sm font-medium">
              🎬 {story.total_scenes} cảnh
            </span>
            <span className="px-4 py-2 bg-green-500/30 text-green-200 rounded-full text-sm font-medium">
              ⏱️ {story.estimated_duration}
            </span>
          </div>

          {/* Content */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">📖 Nội dung:</h3>
            <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
              {story.content}
            </p>
          </div>
        </div>

        {/* Scenes List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">
              🎬 Danh sách cảnh
            </h2>
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all flex items-center gap-2">
              <Play size={20} />
              <span>Tạo tất cả video</span>
            </button>
          </div>

          {scenes.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
              <Film className="mx-auto mb-4 text-white/40" size={64} />
              <h3 className="text-xl font-bold text-white mb-2">Chưa có cảnh nào</h3>
              <p className="text-white/60">Hệ thống đang phân tích văn bản...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenes.map((scene, index) => (
                <div 
                  key={scene.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-start gap-6">
                    {/* Scene Number */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {scene.scene_number}
                        </span>
                      </div>
                    </div>

                    {/* Scene Info */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-white mb-3">
                        Cảnh {scene.scene_number}
                      </h3>

                      {/* Description */}
                      <p className="text-white/80 mb-4 leading-relaxed">
                        {scene.description}
                      </p>

                      {/* Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {scene.location && (
                          <div className="flex items-center gap-2 text-sm text-blue-200 bg-blue-500/20 px-3 py-2 rounded-lg">
                            <MapPin size={16} />
                            <span>{scene.location}</span>
                          </div>
                        )}
                        
                        {scene.characters && scene.characters.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-purple-200 bg-purple-500/20 px-3 py-2 rounded-lg">
                            <Users size={16} />
                            <span>{scene.characters.join(', ')}</span>
                          </div>
                        )}

                        {scene.duration && (
                          <div className="flex items-center gap-2 text-sm text-green-200 bg-green-500/20 px-3 py-2 rounded-lg">
                            <Film size={16} />
                            <span>{scene.duration}s</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {scene.actions && (
                        <div className="text-sm text-white/60 mb-4">
                          <span className="font-semibold">Hành động:</span> {scene.actions}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium">
                          <Play size={16} />
                          <span>Tạo video</span>
                        </button>

                        {scene.video_url && (
                          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium">
                            <Download size={16} />
                            <span>Tải xuống</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}