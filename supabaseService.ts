import { supabase } from './supabaseClient';
import type { Session } from './types';

// Các hàm này sẽ chỉ được gọi nếu supabase được khởi tạo.
// `App.tsx` xử lý việc chuyển đổi giữa service này và storageService.

export const getSessions = async (userId: string): Promise<Session[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Lỗi lấy phiên từ Supabase:', error);
    throw error;
  }
  
  return (data as any[]).map(s => ({...s, id: s.id.toString()})) as Session[];
};

export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");

  // Loại bỏ các trường không nên có trong payload ban đầu
  const { originalContent, ...restOfSessionData } = sessionData;

  const { data, error } = await supabase
    .from('sessions')
    .insert({ ...restOfSessionData, user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Lỗi thêm phiên vào Supabase:', error);
    throw error;
  }

  return { ...data, id: data.id.toString() } as Session;
};

export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  if (!supabase) return;

  // Tách nội dung lớn ra để tránh cập nhật vào bảng `sessions`
  const { originalContent, ...restOfUpdates } = updates;

  if (Object.keys(restOfUpdates).length > 0) {
    const { error } = await supabase
      .from('sessions')
      .update(restOfUpdates)
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Lỗi cập nhật phiên trên Supabase:', error);
      throw error;
    }
  }
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
    if (!supabase) return;
    
    // Xóa khỏi bảng sessions sẽ tự động xóa khỏi session_contents nhờ có ON DELETE CASCADE
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

    if (error) {
        console.error('Lỗi xóa phiên trên Supabase:', error);
        throw error;
    }
};

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    if (!supabase) throw new Error("Supabase chưa được cấu hình.");

    const { error } = await supabase
      .from('session_contents')
      .upsert({ session_id: sessionId, user_id: userId, content: content });

    if (error) {
      console.error('Lỗi tải lên nội dung tệp lên Supabase:', error);
      throw error;
    }
    return sessionId; 
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    if (!supabase) throw new Error("Supabase chưa được cấu hình.");

    const { data, error } = await supabase
      .from('session_contents')
      .select('content')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();
      
    if (error) {
        console.error('Lỗi lấy nội dung tệp từ Supabase:', error);
        throw error;
    }

    return data?.content || "";
};

export const deleteFileContent = async (userId: string, sessionId: string): Promise<void> => {
    if (!supabase) return;
    
    // Xóa từ bảng session_contents
    const { error } = await supabase
        .from('session_contents')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId);

    if (error) {
        console.error('Lỗi xóa nội dung tệp trên Supabase:', error);
        // Không ném lỗi để không làm gián đoạn trải nghiệm người dùng
    }
};