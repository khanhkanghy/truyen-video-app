'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorMessage({ 
  error, 
  retry = null, 
  showHomeButton = true 
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 max-w-md w-full">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Oops! Có lỗi xảy ra
            </h3>
            <p className="text-white/70 mb-4">
              {error?.message || 'Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.'}
            </p>
            
            <div className="flex gap-3">
              {retry && (
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  <RefreshCw size={16} />
                  <span>Thử lại</span>
                </button>
              )}
              
              {showHomeButton && (
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                >
                  <Home size={16} />
                  <span>Về trang chủ</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}