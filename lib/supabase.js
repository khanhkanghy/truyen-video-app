import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Kiểm tra biến môi trường
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Lỗi: Thiếu thông tin Supabase!');
  console.error('👉 Hãy tạo file .env.local và thêm NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Tạo client với error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Test connection
supabase.from('series').select('count').single()
  .then(() => {
    console.log('✅ Kết nối Supabase thành công!');
  })
  .catch((error) => {
    console.warn('⚠️ Không thể kết nối database. Hãy kiểm tra:', error.message);
  });