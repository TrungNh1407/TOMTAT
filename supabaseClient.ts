import { createClient } from '@supabase/supabase-js';

// Sử dụng optional chaining để truy cập an toàn vào các biến môi trường
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

/**
 * Kiểm tra xem các biến môi trường của Supabase có được đặt hay không.
 * @returns {boolean} - Trả về true nếu cả hai biến đều được đặt.
 */
export const isSupabaseEnabled = (): boolean => !!supabaseUrl && !!supabaseAnonKey;

// Ghi lỗi ra console nếu các biến bị thiếu trong môi trường mà chúng được mong đợi
if (typeof (import.meta as any).env !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn("Cảnh báo: Các biến môi trường Supabase VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY bị thiếu. Ứng dụng sẽ chạy ở chế độ offline.");
}

/**
 * Instance client Supabase đã được khởi tạo.
 * Sẽ là null nếu các biến môi trường không được đặt.
 */
export const supabase = isSupabaseEnabled() 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;
