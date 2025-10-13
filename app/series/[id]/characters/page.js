'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  User, 
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';

export default function CharactersManagePage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id;
  
  const [series, setSeries] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    appearance_prompt: '',
    personality: '',
    role: 'Nhân vật phụ',
    reference_image: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (seriesId) {
      fetchData();
    }
  }, [seriesId]);

  const fetchData = async () => {
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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tên nhân vật không được để trống';
    } else if (formData.name.length > 100) {
      errors.name = 'Tên quá dài (tối đa 100 ký tự)';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Mô tả quá dài (tối đa 500 ký tự)';
    }
    
    if (!formData.appearance_prompt.trim()) {
      errors.appearance_prompt = 'Prompt ngoại hình không được để trống';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generatePromptSuggestion = (name, role) => {
    const templates = {
      'Nhân vật chính': `1boy, ${name}, handsome face, black hair, traditional chinese clothing, martial arts outfit, confident expression, detailed eyes, standing pose, fantasy style`,
      'Nhân vật phụ': `1person, ${name}, casual clothing, modern outfit, friendly expression, natural pose`,
      'Phản diện': `1person, ${name}, villain, dark clothing, fierce expression, intimidating pose, scar on face`,
      'Nữ chính': `1girl, ${name}, beautiful face, long hair, elegant dress, gentle expression, detailed features, graceful pose`,
      'Thầy/Sư phụ': `1man, ${name}, elderly, wise expression, white beard, traditional robes, meditation pose, sage appearance`
    };
    
    return templates[role] || templates['Nhân vật phụ'];
  };

  const handleSaveCharacter = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const characterData = {
        ...formData,
        series_id: seriesId,
        updated_at: new Date().toISOString()
      };

      if (editingCharacter) {
        // Update existing character
        const { data, error } = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', editingCharacter.id)
          .select()
          .single();

        if (error) throw error;

        setCharacters(characters.map(char => 
          char.id === editingCharacter.id ? data : char
        ));
        
        alert('✅ Đã cập nhật nhân vật thành công!');
      } else {
        // Create new character
        delete characterData.updated_at;
        characterData.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('characters')
          .insert([characterData])
          .select()
          .single();

        if (error) throw error;

        setCharacters([data, ...characters]);
        alert('✅ Đã thêm nhân vật mới thành công!');
      }

      // Reset form
      setShowAddForm(false);
      setEditingCharacter(null);
      setFormData({
        name: '',
        description: '',
        appearance_prompt: '',
        personality: '',
        role: 'Nhân vật phụ',
        reference_image: ''
      });
      setFormErrors({});

    } catch (err) {
      console.error('Error saving character:', err);
      setError(err);
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCharacter = (character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name || '',
      description: character.description || '',
      appearance_prompt: character.appearance_prompt || '',
      personality: character.personality || '',
      role: character.role || 'Nhân vật phụ',
      reference_image: character.reference_image || ''
    });
    setShowAddForm(true);
    setFormErrors({});
  };

  const handleDeleteCharacter = async (character) => {
    if (!confirm(`Bạn có chắc muốn xóa nhân vật "${character.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', character.id);

      if (error) throw error;

      setCharacters(characters.filter(char => char.id !== character.id));
      alert('✅ Đã xóa nhân vật thành công');
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('❌ Lỗi khi xóa: ' + err.message);
    }
  };

  const copyToClipboard = async (text, charId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(charId);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGeneratePrompt = () => {
    const suggestion = generatePromptSuggestion(formData.name, formData.role);
    setFormData({ ...formData, appearance_prompt: suggestion });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Đang tải danh sách nhân vật..." />
      </div>
    );
  }

  // Error state
  if (error && !series) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          retry={fetchData}
          showHomeButton={true}
        />
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
            <Link href={`/series/${seriesId}`} className="hover:text-white transition-colors">
              {series?.title || 'Loading...'}
            </Link>
            <ChevronRight size={16} />
            <span className="text-white">Nhân vật</span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                👥 Quản lý nhân vật
              </h1>
              <p className="text-white/70">
                Bộ truyện: <span className="font-semibold">{series?.title}</span>
              </p>
              <p className="text-white/60 text-sm mt-1">
                Tổng cộng: {characters.length} nhân vật
              </p>
            </div>
            
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingCharacter(null);
                setFormData({
                  name: '',
                  description: '',
                  appearance_prompt: '',
                  personality: '',
                  role: 'Nhân vật phụ',
                  reference_image: ''
                });
                setFormErrors({});
              }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              <span>Thêm nhân vật</span>
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingCharacter ? '✏️ Sửa nhân vật' : '➕ Thêm nhân vật mới'}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCharacter(null);
                  setFormErrors({});
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Tên nhân vật *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: '' });
                      }
                    }}
                    className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.name ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="VD: Lý Tiểu Long"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.name}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Nhân vật chính" className="bg-gray-800">Nhân vật chính</option>
                    <option value="Nữ chính" className="bg-gray-800">Nữ chính</option>
                    <option value="Nhân vật phụ" className="bg-gray-800">Nhân vật phụ</option>
                    <option value="Phản diện" className="bg-gray-800">Phản diện</option>
                    <option value="Thầy/Sư phụ" className="bg-gray-800">Thầy/Sư phụ</option>
                    <option value="Bạn bè" className="bg-gray-800">Bạn bè</option>
                    <option value="Khác" className="bg-gray-800">Khác</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (formErrors.description) {
                        setFormErrors({ ...formErrors, description: '' });
                      }
                    }}
                    className={`w-full h-24 p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                      formErrors.description ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="VD: Thiếu niên 17 tuổi, đệ tử của Thanh Vân Tông..."
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.description}</p>
                  )}
                </div>

                {/* Personality */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Tính cách
                  </label>
                  <input
                    type="text"
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="VD: Dũng cảm, chính trực, trọng nghĩa khí"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Appearance Prompt */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Prompt ngoại hình (cho AI) *
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.appearance_prompt}
                      onChange={(e) => {
                        setFormData({ ...formData, appearance_prompt: e.target.value });
                        if (formErrors.appearance_prompt) {
                          setFormErrors({ ...formErrors, appearance_prompt: '' });
                        }
                      }}
                      className={`w-full h-32 p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                        formErrors.appearance_prompt ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="VD: 1boy, young man, black hair, traditional chinese clothing, martial arts outfit, confident expression, detailed eyes..."
                    />
                    <button
                      type="button"
                      onClick={handleGeneratePrompt}
                      className="absolute bottom-3 right-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-all flex items-center gap-1"
                    >
                      <Sparkles size={14} />
                      <span>Gợi ý</span>
                    </button>
                  </div>
                  {formErrors.appearance_prompt && (
                    <p className="mt-1 text-red-400 text-sm">{formErrors.appearance_prompt}</p>
                  )}
                  <p className="mt-1 text-white/50 text-xs">
                    Prompt này sẽ được dùng để tạo hình ảnh nhân vật nhất quán
                  </p>
                </div>

                {/* Reference Image URL */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Link ảnh tham khảo (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.reference_image}
                    onChange={(e) => setFormData({ ...formData, reference_image: e.target.value })}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="mt-1 text-white/50 text-xs">
                    URL ảnh tham khảo để AI học style nhân vật
                  </p>
                </div>

                {/* Preview Image */}
                {formData.reference_image && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Xem trước ảnh
                    </label>
                    <div className="w-32 h-32 bg-white/5 rounded-lg overflow-hidden">
                      <img 
                        src={formData.reference_image} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCharacter(null);
                  setFormErrors({});
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCharacter}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{editingCharacter ? 'Cập nhật' : 'Lưu nhân vật'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
            <User className="mx-auto mb-4 text-white/40" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">
              Chưa có nhân vật nào
            </h3>
            <p className="text-white/60 mb-6">
              Thêm nhân vật để AI có thể tạo hình ảnh nhất quán
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              Thêm nhân vật đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div 
                key={character.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
              >
                {/* Character Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    {character.reference_image ? (
                      <img 
                        src={character.reference_image} 
                        alt={character.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span class="text-2xl font-bold text-white">${character.name.charAt(0)}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {character.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{character.name}</h3>
                    <span className="inline-block px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-medium mt-1">
                      {character.role}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {character.description && (
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {character.description}
                  </p>
                )}

                {/* Personality */}
                {character.personality && (
                  <p className="text-white/60 text-xs mb-3">
                    <span className="font-semibold">Tính cách:</span> {character.personality}
                  </p>
                )}

                {/* Appearance Prompt */}
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white/50 text-xs font-medium">AI Prompt:</p>
                    <button
                      onClick={() => copyToClipboard(character.appearance_prompt, character.id)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {copiedPrompt === character.id ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                  <p className="text-white/70 text-xs line-clamp-3">
                    {character.appearance_prompt}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCharacter(character)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
                  >
                    <Edit2 size={14} />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(character)}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center justify-center gap-1 text-sm"
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h4 className="text-white font-semibold mb-2">💡 Hướng dẫn tạo nhân vật</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• <strong>Prompt ngoại hình</strong> rất quan trọng - AI sẽ dùng để tạo hình ảnh nhất quán</li>
                <li>• Nên mô tả chi tiết: giới tính, tuổi, màu tóc, trang phục, phong cách</li>
                <li>• Ví dụ prompt tốt: "1boy, young man, black hair, blue eyes, white shirt, modern style"</li>
                <li>• Có thể thêm ảnh tham khảo để AI học style vẽ</li>
                <li>• Nhấn nút "Gợi ý" để tạo prompt tự động dựa trên vai trò</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}