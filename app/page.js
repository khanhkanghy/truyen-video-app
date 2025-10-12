'use client';

import React, { useState } from 'react';
import { Upload, FileText, Zap, CheckCircle, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎬 Truyện → Video AI
          </h1>
          <p className="text-xl text-purple-200 mb-6">
            Chuyển văn bản thành video tự động
          </p>
          
          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-center">
            <a 
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all font-semibold text-lg"
            >
              <Upload size={24} />
              <span>Upload Chương Mới</span>
            </a>
            
            <a 
              href="/series"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 font-semibold text-lg"
            >
              <BookOpen size={24} />
              <span>Quản lý Bộ Truyện</span>
            </a>
          </div>
        </div>

        {/* Main Card - Demo Features */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            ✨ Tính năng chính
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-white mb-2">Quản lý bộ truyện</h3>
              <p className="text-white/70">
                Tạo và quản lý nhiều bộ truyện, mỗi bộ có nhiều chương
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">AI phân tích</h3>
              <p className="text-white/70">
                Tự động nhận diện nhân vật, địa điểm và tạo cảnh phim
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-2">Tạo video</h3>
              <p className="text-white/70">
                Chuyển đổi văn bản thành video với nhân vật nhất quán
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">∞</p>
              <p className="text-white/60">Bộ truyện</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">AI</p>
              <p className="text-white/60">Phân tích thông minh</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">4K</p>
              <p className="text-white/60">Video chất lượng cao</p>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-white/60 text-sm">
          💡 Tip: Văn bản càng chi tiết, video càng chính xác
        </div>
      </div>
    </div>
  );
}