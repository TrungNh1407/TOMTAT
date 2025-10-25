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
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, getBytes } from "firebase/storage";
import type { Session } from './types';
import { isAiStudio } from './isAiStudio';

const isStudio = isAiStudio();

// Lấy tất cả các phiên làm việc của một người dùng, sắp xếp theo thời gian gần nhất
export const getSessions = async (userId: string): Promise<Session[]> => {
  if (isStudio || !db) return [];

  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('timestamp', 'desc'));
  const sessionSnapshot = await getDocs(q);
  return sessionSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
};

// Thêm một phiên làm việc mới
export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
    if (isStudio || !db) {
        return {
            ...sessionData,
            id: `aistudio-session-${Date.now()}`,
            timestamp: Date.now()
        };
    }

    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const docRef = await addDoc(sessionsCol, {
        ...sessionData,
        timestamp: serverTimestamp()
    });
    
    const newDoc = await getDoc(docRef);
    const data = newDoc.data();
    const timestamp = data?.timestamp ? data.timestamp.toMillis() : Date.now();
    return { ...(data as Omit<Session, 'id' | 'timestamp'>), id: newDoc.id, timestamp };
};

// Cập nhật một phiên làm việc
export const updateSession = (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  if (isStudio || !db) return Promise.resolve();

  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return updateDoc(sessionDoc, { ...updates, timestamp: serverTimestamp() });
};

// Xóa một phiên làm việc
export const deleteSession = (userId: string, sessionId: string): Promise<void> => {
  if (isStudio || !db) return Promise.resolve();

  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return deleteDoc(sessionDoc);
};

// Tải nội dung tệp lên Firebase Storage
export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    if (isStudio || !storage) return '';

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
