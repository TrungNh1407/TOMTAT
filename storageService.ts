import type { Session } from './types';

const USER_ID_KEY = 'med_ai_local_user_id';
const SESSIONS_KEY_PREFIX = 'med_ai_sessions_';

// Một hàm tạo UUID đơn giản để tránh phụ thuộc
const simpleUUID = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Lấy ID người dùng cục bộ, hoặc tạo một ID mới nếu chưa tồn tại.
 */
export const getUserId = (): string => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `local-user-${simpleUUID()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

/**
 * Lấy tất cả các phiên làm việc của một người dùng từ localStorage.
 */
export const getSessions = async (userId: string): Promise<Session[]> => {
  const key = `${SESSIONS_KEY_PREFIX}${userId}`;
  try {
    const storedSessions = localStorage.getItem(key);
    if (storedSessions) {
      const sessions = JSON.parse(storedSessions) as Session[];
      // Sắp xếp theo timestamp giảm dần để mô phỏng hành vi của Firestore
      return sessions.sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch (error) {
    console.error("Không thể tải các phiên từ localStorage", error);
  }
  return [];
};

/**
 * Lưu tất cả các phiên làm việc của một người dùng vào localStorage.
 */
const saveSessions = async (userId: string, sessions: Session[]): Promise<void> => {
  const key = `${SESSIONS_KEY_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(sessions));
  } catch (error) {
    console.error("Không thể lưu các phiên vào localStorage", error);
    throw new Error("Không thể lưu phiên. Bộ nhớ có thể đã đầy.");
  }
};

/**
 * Thêm một phiên làm việc mới.
 */
export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  const sessions = await getSessions(userId);
  const newSession: Session = {
    ...sessionData,
    id: `session-${simpleUUID()}`,
    userId,
    timestamp: Date.now(),
  };
  const newSessions = [newSession, ...sessions];
  await saveSessions(userId, newSessions);
  return newSession;
};

/**
 * Cập nhật một phiên làm việc đã có.
 */
export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  const sessions = await getSessions(userId);
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex > -1) {
    sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
    await saveSessions(userId, sessions);
  } else {
    console.warn(`Không tìm thấy phiên có id ${sessionId} để cập nhật.`);
  }
};

/**
 * Xóa một phiên làm việc.
 */
export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessions = await getSessions(userId);
  const newSessions = sessions.filter(s => s.id !== sessionId);
  await saveSessions(userId, newSessions);
};

// Việc quản lý nội dung tệp giờ đây đơn giản hơn nhiều.
// Nó được xử lý trực tiếp bởi `updateSession` với thuộc tính `originalContent`.
// Các hàm này được giữ lại để tương thích với cấu trúc của App.tsx, nhưng chúng chỉ gọi updateSession.

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    await updateSession(userId, sessionId, { originalContent: content, originalContentUrl: sessionId });
    return sessionId; // Trả về sessionId như một pseudo-URL
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    const sessions = await getSessions(userId);
    const session = sessions.find(s => s.id === sessionId);
    if (session && typeof session.originalContent === 'string') {
        return session.originalContent;
    }
    throw new Error("Không tìm thấy nội dung tệp trong phiên.");
};

export const deleteFileContent = (userId: string, sessionId: string): Promise<void> => {
    return updateSession(userId, sessionId, { originalContent: undefined, originalContentUrl: undefined });
};