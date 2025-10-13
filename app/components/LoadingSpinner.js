'use client';

export default function LoadingSpinner({ size = 'medium', message = 'Đang tải...' }) {
  const sizeClasses = {
    small: 'h-8 w-8 border-2',
    medium: 'h-12 w-12 border-3',
    large: 'h-16 w-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-white border-t-transparent ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-white/80 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}