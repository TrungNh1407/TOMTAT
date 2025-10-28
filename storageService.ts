import type { Session } from './types';

const USER_ID_KEY = 'med_ai_local_user_id';
const SESSIONS_KEY_PREFIX = 'med_ai_sessions_';
const SAVE_DELAY = 500; // ms

// In-memory cache to store sessions for a given user to batch writes.
// Keyed by userId to handle potential user switching scenarios.
const sessionsCache: { [userId: string]: Session[] } = {};
let saveTimeout: ReturnType<typeof setTimeout> | null = null;


// Một hàm tạo UUID đơn giản để tránh phụ thuộc
const simpleUUID = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Lên lịch một thao tác ghi vào localStorage sau một khoảng trễ,
 * gom nhóm nhiều thay đổi thành một lần ghi duy nhất.
 */
const scheduleSave = (userId: string) => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
        if (sessionsCache[userId]) {
            const key = `${SESSIONS_KEY_PREFIX}${userId}`;
            try {
                // console.log('Batch saving to localStorage...');
                localStorage.setItem(key, JSON.stringify(sessionsCache[userId]));
            } catch (error) {
                console.error("Không thể lưu các phiên vào localStorage", error);
                // Tùy chọn: có thể thông báo cho người dùng tại đây.
            }
        }
    }, SAVE_DELAY);
};


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
 * Lấy tất cả các phiên làm việc của một người dùng từ localStorage hoặc cache.
 */
export const getSessions = async (userId: string): Promise<Session[]> => {
  // Nếu có cache cho người dùng, trả về ngay lập tức.
  if (sessionsCache[userId]) {
    return sessionsCache[userId];
  }

  // Nếu không, tải từ localStorage.
  const key = `${SESSIONS_KEY_PREFIX}${userId}`;
  try {
    const storedSessions = localStorage.getItem(key);
    const sessions = storedSessions ? JSON.parse(storedSessions) as Session[] : [];
    
    // Sắp xếp để đảm bảo thứ tự nhất quán, mô phỏng hành vi của Firestore.
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    
    // Điền vào cache.
    sessionsCache[userId] = sessions;
    return sessions;
  } catch (error) {
    console.error("Không thể tải các phiên từ localStorage", error);
    sessionsCache[userId] = []; // Khởi tạo với mảng rỗng nếu có lỗi
    return [];
  }
};


/**
 * Thêm một phiên làm việc mới vào cache và lên lịch lưu.
 */
export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  // Đảm bảo cache đã được điền
  await getSessions(userId); 

  const newSession: Session = {
    ...sessionData,
    id: `session-${simpleUUID()}`,
    userId,
    timestamp: Date.now(),
  };

  // Thay đổi trực tiếp cache
  sessionsCache[userId] = [newSession, ...sessionsCache[userId]];
  
  // Lên lịch lưu
  scheduleSave(userId);
  
  return newSession;
};

/**
 * Cập nhật một phiên làm việc đã có trong cache và lên lịch lưu.
 */
export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  await getSessions(userId); // Đảm bảo cache đã được điền
  
  const sessionIndex = sessionsCache[userId].findIndex(s => s.id === sessionId);
  
  if (sessionIndex > -1) {
    sessionsCache[userId][sessionIndex] = { ...sessionsCache[userId][sessionIndex], ...updates };
    scheduleSave(userId);
  } else {
    console.warn(`Không tìm thấy phiên có id ${sessionId} để cập nhật.`);
  }
};

/**
 * Xóa một phiên làm việc khỏi cache và lên lịch lưu.
 */
export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  await getSessions(userId); // Đảm bảo cache đã được điền
  
  const initialLength = sessionsCache[userId].length;
  sessionsCache[userId] = sessionsCache[userId].filter(s => s.id !== sessionId);

  if (sessionsCache[userId].length < initialLength) {
    scheduleSave(userId);
  }
};

// Các hàm quản lý nội dung tệp giờ đây sẽ tự động hưởng lợi từ cơ chế batching
// vì chúng gọi hàm `updateSession`.

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    await updateSession(userId, sessionId, { originalContent: content, originalContentUrl: sessionId });
    return sessionId; // Trả về sessionId như một pseudo-URL
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    // Luôn đọc từ cache trước để có dữ liệu mới nhất
    await getSessions(userId);
    const session = sessionsCache[userId].find(s => s.id === sessionId);
    if (session && typeof session.originalContent === 'string') {
        return session.originalContent;
    }
    throw new Error("Không tìm thấy nội dung tệp trong phiên.");
};

export const deleteFileContent = (userId: string, sessionId: string): Promise<void> => {
    return updateSession(userId, sessionId, { originalContent: undefined, originalContentUrl: undefined });
};