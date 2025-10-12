'use client';

import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, Zap, Plus, Check, Film } from 'lucide-react';

export default function NewChapterUpload() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [showNewSeries, setShowNewSeries] = useState(false);
  
  // Form data
  const [newSeriesData, setNewSeriesData] = useState({
    title: '',
    description: '',
    genre: 'Tiên hiệp'
  });
  
  const [chapterData, setChapterData] = useState({
    chapterNumber: 1,
    title: '',
    content: ''
  });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch series list
  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
  try {
    const response = await fetch('/api/series');
    
    // Kiểm tra response
    if (!response.ok) {
      console.error('API error:', response.status);
      return;
    }

    const data = await response.json();
    
    // Kiểm tra data structure
    if (data.success && Array.isArray(data.series)) {
      setSeries(data.series);
    } else {
      console.error('Invalid data format:', data);
      setSeries([]);
    }
  } catch (error) {
    console.error('Error fetching series:', error);
    setSeries([]);
  }
};

  // Create new series
  const handleCreateSeries = async () => {
  if (!newSeriesData.title) {
    alert('Vui lòng nhập tên bộ truyện!');
    return;
  }

  try {
    const response = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeriesData)
    });

    const data = await response.json();
    
    if (data.success && data.series) {
      // Thành công
      setSelectedSeries(data.series.id);
      setSeries([...series, data.series]);
      setShowNewSeries(false);
      setNewSeriesData({ title: '', description: '', genre: 'Tiên hiệp' });
      alert('✅ Tạo bộ truyện thành công!');
    } else {
      // Có lỗi
      alert('❌ Lỗi: ' + (data.error || 'Không thể tạo bộ truyện'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Có lỗi xảy ra: ' + error.message);
  }
};

  // Analyze chapter
  const handleAnalyzeChapter = async () => {
    if (!selectedSeries) {
      alert('Vui lòng chọn bộ truyện!');
      return;
    }
    if (!chapterData.content) {
      alert('Vui lòng nhập nội dung chương!');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/chapters/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: selectedSeries,
          ...chapterData
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.analysis);
        alert('✅ Phân tích hoàn tất!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Có lỗi xảy ra!');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-white mb-4">
            📖 Upload Chương Truyện
          </h1>
          <p className="text-xl text-purple-200">
            Chọn bộ truyện và thêm chương mới
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          
          {/* SECTION 1: Chọn/Tạo Series */}
          <div className="mb-8">
            <label className="block text-white text-lg font-semibold mb-4">
              📚 Bộ truyện:
            </label>

            {!showNewSeries ? (
              <div className="space-y-4">
                {/* Dropdown chọn series */}
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  className="w-full p-4 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn bộ truyện --</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.genre}) - {s.total_chapters || 0} chương
                    </option>
                  ))}
                </select>

                {/* Button tạo mới */}
                <button
                  onClick={() => setShowNewSeries(true)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  <span>Tạo bộ truyện mới</span>
                </button>
              </div>
            ) : (
              // Form tạo series mới
              <div className="bg-white/5 rounded-xl p-6 border border-white/20 space-y-4">
                <input
                  type="text"
                  placeholder="Tên bộ truyện (VD: Tu Tiên Truyện)"
                  value={newSeriesData.title}
                  onChange={(e) => setNewSeriesData({...newSeriesData, title: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <textarea
                  placeholder="Mô tả ngắn về bộ truyện..."
                  value={newSeriesData.description}
                  onChange={(e) => setNewSeriesData({...newSeriesData, description: e.target.value})}
                  className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />

                <select
                  value={newSeriesData.genre}
                  onChange={(e) => setNewSeriesData({...newSeriesData, genre: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Tiên hiệp">Tiên hiệp</option>
                  <option value="Kiếm hiệp">Kiếm hiệp</option>
                  <option value="Huyền huyễn">Huyền huyễn</option>
                  <option value="Đô thị">Đô thị</option>
                  <option value="Lãng mạn">Lãng mạn</option>
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateSeries}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    <span>Tạo</span>
                  </button>
                  <button
                    onClick={() => setShowNewSeries(false)}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Thông tin chương */}
          {selectedSeries && (
            <>
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-4">
                  📄 Thông tin chương:
                </label>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Số chương"
                    value={chapterData.chapterNumber}
                    onChange={(e) => setChapterData({...chapterData, chapterNumber: parseInt(e.target.value)})}
                    className="p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  <input
                    type="text"
                    placeholder="Tên chương (VD: Khởi đầu)"
                    value={chapterData.title}
                    onChange={(e) => setChapterData({...chapterData, title: e.target.value})}
                    className="p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* SECTION 3: Nội dung chương */}
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-4">
                  ✍️ Nội dung chương:
                </label>

                <textarea
                  value={chapterData.content}
                  onChange={(e) => setChapterData({...chapterData, content: e.target.value})}
                  placeholder="Dán nội dung chương vào đây...

Ví dụ:
Trên đỉnh núi Thái Sơn, mây mù bao phủ. Lý Tiểu Long ngồi xếp bằng...
"
                  className="w-full h-96 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeChapter}
                disabled={analyzing}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    <span>Phân tích chương</span>
                  </>
                )}
              </button>

              {/* Results */}
              {result && (
                <div className="mt-6 p-6 bg-green-500/20 border border-green-400/50 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Check className="text-green-400" size={24} />
                    Phân tích hoàn tất!
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Đoạn văn</p>
                      <p className="text-2xl font-bold text-white">{result.totalParagraphs}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Cảnh</p>
                      <p className="text-2xl font-bold text-white">{result.totalScenes}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Nhân vật</p>
                      <p className="text-2xl font-bold text-white">{result.characters?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Thời lượng</p>
                      <p className="text-2xl font-bold text-white">{result.estimatedDuration}</p>
                    </div>
                  </div>

                  <a
                    href={`/chapters/${result.chapterId}`}
                    className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Film size={20} />
                    <span>Xem chi tiết & Tạo video</span>
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-white/60 text-sm">
          💡 Mỗi chương sẽ tự động được phân tích thành các cảnh và nhận diện nhân vật
        </div>
      </div>
    </div>
  );
}