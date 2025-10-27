import { db, storage } from './firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, getBytes } from "firebase/storage";
import type { Session } from './types';
import { isAiStudio } from './isAiStudio';

const isStudio = isAiStudio();
const GUEST_USER_ID = 'guest-user';
const GUEST_SESSIONS_KEY = 'medai-guest-sessions';

// --- Guest Mode (localStorage) Helpers ---

const getGuestSessions = (): Session[] => {
    try {
        const storedSessions = localStorage.getItem(GUEST_SESSIONS_KEY);
        return storedSessions ? JSON.parse(storedSessions) : [];
    } catch (e) {
        console.error("Lỗi đọc các phiên của khách:", e);
        return [];
    }
};

const saveGuestSessions = (sessions: Session[]) => {
    try {
        localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Lỗi lưu các phiên của khách:", e);
    }
};


// --- Main Service Functions ---

// Lấy tất cả các phiên làm việc của một người dùng, sắp xếp theo thời gian gần nhất
export const getSessions = async (userId: string): Promise<Session[]> => {
  if (isStudio) return [];
  if (userId === GUEST_USER_ID) {
      return Promise.resolve(getGuestSessions().sort((a, b) => b.timestamp - a.timestamp));
  }
  if (!db) return [];

  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('timestamp', 'desc'));
  const sessionSnapshot = await getDocs(q);
  return sessionSnapshot.docs.map(doc => {
      const data = doc.data();
      // Chuyển đổi Firestore Timestamp thành milliseconds
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : Date.now();
      return { ...data, id: doc.id, timestamp } as Session;
  });
};

// Thêm một phiên làm việc mới
export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
    const newSession: Session = {
        ...sessionData,
        id: `local-${Date.now()}`, // ID tạm thời
        timestamp: Date.now()
    };

    if (isStudio || userId === GUEST_USER_ID) {
        if (userId === GUEST_USER_ID) {
            const sessions = getGuestSessions();
            sessions.unshift(newSession);
            saveGuestSessions(sessions);
        }
        return Promise.resolve(newSession);
    }
    
    if (!db) return Promise.resolve(newSession);

    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const docRef = await addDoc(sessionsCol, {
        ...sessionData,
        timestamp: serverTimestamp()
    });
    
    // Trả về đối tượng phiên đã tạo ở phía client với ID thực từ Firestore.
    // Không cần đọc lại tài liệu vì serverTimestamp có thể chưa được điền ngay.
    return { ...newSession, id: docRef.id };
};

// Cập nhật một phiên làm việc
export const updateSession = (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  if (isStudio) return Promise.resolve();

  if (userId === GUEST_USER_ID) {
      const sessions = getGuestSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex > -1) {
          sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates, timestamp: Date.now() };
          saveGuestSessions(sessions);
      }
      return Promise.resolve();
  }

  if (!db) return Promise.resolve();
  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return updateDoc(sessionDoc, { ...updates, timestamp: serverTimestamp() });
};

// Xóa một phiên làm việc
export const deleteSession = (userId: string, sessionId: string): Promise<void> => {
  if (isStudio) return Promise.resolve();

  if (userId === GUEST_USER_ID) {
      const sessions = getGuestSessions();
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      saveGuestSessions(updatedSessions);
      return Promise.resolve();
  }

  if (!db) return Promise.resolve();
  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return deleteDoc(sessionDoc);
};

// Tải nội dung tệp lên Firebase Storage
export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    if (isStudio || !storage || userId === GUEST_USER_ID) return '';

    const storageRef = ref(storage, `users/${userId}/sessions/${sessionId}/originalContent.txt`);
    await uploadString(storageRef, content);
    return getDownloadURL(storageRef);
};

// Lấy nội dung tệp từ Firebase Storage
export const getFileContent = async (url: string): Promise<string> => {
    if (isStudio || !storage || !url) return '';
    
    const storageRef = ref(storage, url);
    const bytes = await getBytes(storageRef);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
};


// Xóa nội dung tệp khỏi Firebase Storage
export const deleteFileContent = (url: string): Promise<void> => {
    if (isStudio || !storage || !url) return Promise.resolve();
    
    try {
        const storageRef = ref(storage, url);
        return deleteObject(storageRef);
    } catch (error) {
        console.error("Lỗi khi xóa tệp:", error);
        return Promise.resolve();
    }
};