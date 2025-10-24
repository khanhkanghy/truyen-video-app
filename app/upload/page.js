'use client';

import React, { useState, useEffect } from 'react';
import { Upload, BookOpen, Zap, Plus, Check, Film, AlertCircle, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';

export default function NewChapterUpload() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // ⭐ NEW: Director mode options
  const [useDirectorMode, setUseDirectorMode] = useState(true); // Default to director mode
  const [userPrompt, setUserPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch series list
  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/series');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.series)) {
        setSeries(data.series);
        
        // Auto-select nếu chỉ có 1 series
        if (data.series.length === 1) {
          setSelectedSeries(data.series[0].id);
        }
      } else {
        console.error('Invalid data format:', data);
        setSeries([]);
      }
    } catch (err) {
      console.error('Error fetching series:', err);
      setError(err);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateSeriesForm = () => {
    const errors = {};
    
    if (!newSeriesData.title.trim()) {
      errors.title = 'Tên bộ truyện không được để trống';
    } else if (newSeriesData.title.length > 200) {
      errors.title = 'Tên bộ truyện quá dài (tối đa 200 ký tự)';
    }
    
    if (newSeriesData.description && newSeriesData.description.length > 1000) {
      errors.description = 'Mô tả quá dài (tối đa 1000 ký tự)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateChapterForm = () => {
    const errors = {};
    
    if (!selectedSeries) {
      errors.series = 'Vui lòng chọn bộ truyện';
    }
    
    if (chapterData.chapterNumber < 1) {
      errors.chapterNumber = 'Số chương phải từ 1 trở lên';
    }
    
    if (!chapterData.content.trim()) {
      errors.content = 'Nội dung không được để trống';
    } else if (chapterData.content.length < 100) {
      errors.content = 'Nội dung quá ngắn (tối thiểu 100 ký tự)';
    } else if (chapterData.content.length > 100000) {
      errors.content = 'Nội dung quá dài (tối đa 100.000 ký tự)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new series
  const handleCreateSeries = async () => {
    if (!validateSeriesForm()) return;

    try {
      setLoading(true);
      setError(null);
      
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
        setFormErrors({});
        
        // Thông báo thành công
        alert('✅ Tạo bộ truyện thành công!');
      } else {
        throw new Error(data.error || 'Không thể tạo bộ truyện');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err);
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ UPDATED: Analyze chapter with Director Mode support
  const handleAnalyzeChapter = async () => {
    if (!validateChapterForm()) return;

    setAnalyzing(true);
    setError(null);

    try {
      // ⭐ Choose API endpoint based on mode
      const apiEndpoint = useDirectorMode
        ? '/api/chapters/analyze-director'
        : '/api/chapters/analyze';

      console.log(`🎬 Using ${useDirectorMode ? 'DIRECTOR MODE' : 'STANDARD MODE'}`);
      if (useDirectorMode && userPrompt) {
        console.log(`📝 Custom prompt: ${userPrompt}`);
      }

      const requestBody = {
        seriesId: selectedSeries,
        ...chapterData
      };

      // ⭐ Add user prompt if director mode
      if (useDirectorMode && userPrompt.trim()) {
        requestBody.userPrompt = userPrompt.trim();
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi phân tích');
      }

      if (data.success) {
        setResult(data);

        // Reset form
        setChapterData({
          chapterNumber: chapterData.chapterNumber + 1,
          title: '',
          content: ''
        });

        // Reset custom prompt sau khi thành công
        if (useDirectorMode) {
          setUserPrompt('');
        }

        // ⭐ Thông báo có thông tin mode
        const mode = useDirectorMode ? '🎬 DIRECTOR MODE' : 'Standard';
        const sceneCount = data.analysis?.total_scenes || data.analysis?.totalScenes || 0;
        const message = `✅ Phân tích hoàn tất với ${mode}!\n\n` +
          `📊 Đã tạo ${sceneCount} cảnh chuyên nghiệp.\n` +
          (data.analysis?.story_summary ? `📖 ${data.analysis.story_summary}\n` : '') +
          (data.analysis?.cost ? `💰 Chi phí AI: $${data.analysis.cost.toFixed(4)}` : '');

        alert(message);
      } else {
        throw new Error(data.error || 'Phân tích thất bại');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err);
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Loading state
  if (loading && !analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Quay lại trang chủ</span>
          </Link>
          
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold text-white mb-4">
              📖 Upload Chương Truyện
            </h1>
            <p className="text-xl text-purple-200">
              Chọn bộ truyện và thêm chương mới
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && !analyzing && (
          <div className="mb-6">
            <ErrorMessage 
              error={error} 
              retry={() => {
                setError(null);
                fetchSeries();
              }}
              showHomeButton={false}
            />
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          
          {/* SECTION 1: Chọn/Tạo Series */}
          <div className="mb-8">
            <label className="block text-white text-lg font-semibold mb-4">
              📚 Bộ truyện:
            </label>

            {!showNewSeries ? (
              <div className="space-y-4">
                {/* Dropdown chọn series */}
                <div>
                  <select
                    value={selectedSeries}
                    onChange={(e) => {
                      setSelectedSeries(e.target.value);
                      setFormErrors({});
                    }}
                    className={`w-full p-4 bg-white/10 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.series ? 'border-red-500' : 'border-white/30'
                    }`}
                  >
                    <option value="" className="bg-gray-800">-- Chọn bộ truyện --</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id} className="bg-gray-800">
                        {s.title} ({s.genre}) - {s.total_chapters || 0} chương
                      </option>
                    ))}
                  </select>
                  {formErrors.series && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.series}</p>
                  )}
                </div>

                {/* Button tạo mới */}
                <button
                  onClick={() => {
                    setShowNewSeries(true);
                    setFormErrors({});
                  }}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Plus size={20} />
                  <span>Tạo bộ truyện mới</span>
                </button>
              </div>
            ) : (
              // Form tạo series mới
              <div className="bg-white/5 rounded-xl p-6 border border-white/20 space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Tên bộ truyện (VD: Tu Tiên Truyện)"
                    value={newSeriesData.title}
                    onChange={(e) => {
                      setNewSeriesData({...newSeriesData, title: e.target.value});
                      if (formErrors.title) {
                        setFormErrors({...formErrors, title: ''});
                      }
                    }}
                    className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.title ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Mô tả ngắn về bộ truyện..."
                    value={newSeriesData.description}
                    onChange={(e) => {
                      setNewSeriesData({...newSeriesData, description: e.target.value});
                      if (formErrors.description) {
                        setFormErrors({...formErrors, description: ''});
                      }
                    }}
                    className={`w-full h-24 p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      formErrors.description ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.description}</p>
                  )}
                </div>

                <select
                  value={newSeriesData.genre}
                  onChange={(e) => setNewSeriesData({...newSeriesData, genre: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Tiên hiệp" className="bg-gray-800">Tiên hiệp</option>
                  <option value="Kiếm hiệp" className="bg-gray-800">Kiếm hiệp</option>
                  <option value="Huyền huyễn" className="bg-gray-800">Huyền huyễn</option>
                  <option value="Đô thị" className="bg-gray-800">Đô thị</option>
                  <option value="Lãng mạn" className="bg-gray-800">Lãng mạn</option>
                  <option value="Kinh dị" className="bg-gray-800">Kinh dị</option>
                  <option value="Khoa học viễn tưởng" className="bg-gray-800">Khoa học viễn tưởng</option>
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateSeries}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <>
                        <Check size={20} />
                        <span>Tạo bộ truyện</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewSeries(false);
                      setFormErrors({});
                      setNewSeriesData({ title: '', description: '', genre: 'Tiên hiệp' });
                    }}
                    className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    <span>Hủy</span>
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
                  <div>
                    <input
                      type="number"
                      placeholder="Số chương"
                      value={chapterData.chapterNumber}
                      onChange={(e) => {
                        setChapterData({...chapterData, chapterNumber: parseInt(e.target.value) || 1});
                        if (formErrors.chapterNumber) {
                          setFormErrors({...formErrors, chapterNumber: ''});
                        }
                      }}
                      min="1"
                      className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        formErrors.chapterNumber ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {formErrors.chapterNumber && (
                      <p className="mt-1 text-red-400 text-sm">{formErrors.chapterNumber}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Tên chương (VD: Khởi đầu)"
                      value={chapterData.title}
                      onChange={(e) => setChapterData({...chapterData, title: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Nội dung chương */}
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-4">
                  ✍️ Nội dung chương:
                </label>

                <div>
                  <textarea
                    value={chapterData.content}
                    onChange={(e) => {
                      setChapterData({...chapterData, content: e.target.value});
                      if (formErrors.content) {
                        setFormErrors({...formErrors, content: ''});
                      }
                    }}
                    placeholder="Dán nội dung chương vào đây...

Ví dụ:
Trên đỉnh núi Thái Sơn, mây mù bao phủ. Lý Tiểu Long ngồi xếp bằng..."
                    className={`w-full h-96 p-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm ${
                      formErrors.content ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {formErrors.content && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.content}</p>
                  )}
                  
                  {/* Character counter */}
                  <div className="mt-2 text-right text-white/60 text-sm">
                    {chapterData.content.length} / 100.000 ký tự
                  </div>
                </div>
              </div>

              {/* ⭐ NEW: SECTION 4: AI Director Mode Options */}
              <div className="mb-6">
                <label className="block text-white text-lg font-semibold mb-4">
                  🎬 Tùy chọn AI:
                </label>

                {/* Director Mode Toggle */}
                <div className="bg-white/5 border border-white/20 rounded-xl p-5 mb-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id="directorMode"
                      checked={useDirectorMode}
                      onChange={(e) => setUseDirectorMode(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-white/30 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="directorMode" className="text-white font-semibold cursor-pointer flex items-center gap-2">
                        <Film size={20} className="text-purple-400" />
                        <span>Director Mode - AI Đạo diễn chuyên nghiệp</span>
                        <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                          Recommended
                        </span>
                      </label>
                      <p className="mt-2 text-white/60 text-sm leading-relaxed">
                        ✨ AI sẽ phân tích toàn bộ chapter như một <strong>đạo diễn điện ảnh</strong>, tự động chia thành các cảnh quay hợp lý dựa trên logic kịch bản (không phải theo xuống dòng). Mỗi cảnh sẽ có đầy đủ thông tin: camera angles, lighting, mood, dialogue, visual description chi tiết.
                      </p>
                      <p className="mt-1 text-white/50 text-xs">
                        💰 Chi phí: ~$0.05-0.15/chapter (dùng GPT-4o) | Chất lượng: ⭐⭐⭐⭐⭐
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Prompt (chỉ hiện khi Director Mode ON) */}
                {useDirectorMode && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white font-semibold flex items-center gap-2">
                        <Zap size={18} className="text-blue-400" />
                        <span>Yêu cầu tùy chỉnh (Tùy chọn)</span>
                      </label>
                      <button
                        onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                        className="text-blue-300 hover:text-blue-200 text-sm transition-colors"
                      >
                        {showCustomPrompt ? '🔽 Ẩn' : '▶️ Mở rộng'}
                      </button>
                    </div>

                    {showCustomPrompt && (
                      <div className="mt-3">
                        <textarea
                          value={userPrompt}
                          onChange={(e) => setUserPrompt(e.target.value)}
                          placeholder="VD:
- Tập trung vào cảm xúc nhân vật
- Chia thành nhiều cảnh ngắn (5-10s mỗi cảnh)
- Mô tả chi tiết hiệu ứng võ thuật
- Thêm nhiều góc máy động
- Nhấn mạnh vào ánh sáng và bầu không khí
- ..."
                          className="w-full h-32 p-3 bg-white/5 border border-blue-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                        />
                        <p className="mt-2 text-blue-300/70 text-xs">
                          💡 Tip: Viết rõ ràng yêu cầu của bạn, AI sẽ tuân theo khi phân tích!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeChapter}
                disabled={analyzing || !chapterData.content}
                className={`w-full py-4 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl ${
                  useDirectorMode
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                }`}
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang phân tích chương...</span>
                  </>
                ) : (
                  <>
                    {useDirectorMode ? <Film size={20} /> : <Zap size={20} />}
                    <span>
                      {useDirectorMode ? '🎬 Phân tích với AI Đạo diễn' : 'Phân tích & Tạo cảnh'}
                    </span>
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
                      <p className="text-2xl font-bold text-white">{result.analysis?.totalParagraphs || 0}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Cảnh</p>
                      <p className="text-2xl font-bold text-white">{result.analysis?.totalScenes || 0}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Nhân vật</p>
                      <p className="text-2xl font-bold text-white">{result.analysis?.characters?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/60 text-sm">Thời lượng</p>
                      <p className="text-2xl font-bold text-white">{result.analysis?.estimatedDuration || '0 phút'}</p>
                    </div>
                  </div>

                  {result.chapterId && (
                    <Link
                      href={`/chapters/${result.chapterId}`}
                      className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow hover:shadow-lg"
                    >
                      <Film size={20} />
                      <span>Xem chi tiết & Tạo video</span>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-white font-semibold mb-2">💡 Hướng dẫn sử dụng</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Chọn bộ truyện có sẵn hoặc tạo mới</li>
                <li>• Mỗi chương sẽ tự động được phân tích thành các cảnh</li>
                <li>• AI sẽ nhận diện nhân vật, địa điểm, và tâm trạng</li>
                <li>• Nội dung càng chi tiết, kết quả phân tích càng tốt</li>
                <li>• Độ dài tối thiểu: 100 ký tự, tối đa: 100.000 ký tự</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}