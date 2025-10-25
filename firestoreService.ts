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
  limit
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject, getBytes } from "firebase/storage";
import type { Session } from './types';

// Lấy tất cả các phiên làm việc của một người dùng, sắp xếp theo thời gian gần nhất
export const getSessions = async (userId: string): Promise<Session[]> => {
  const sessionsCol = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsCol, orderBy('timestamp', 'desc'));
  const sessionSnapshot = await getDocs(q);
  return sessionSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Session));
};

// Thêm một phiên làm việc mới
export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const docRef = await addDoc(sessionsCol, {
        ...sessionData,
        timestamp: serverTimestamp() // Sử dụng timestamp của server để đồng bộ
    });
    // Lấy lại dữ liệu từ server để có timestamp chính xác
    const newDoc = await getDoc(docRef);
    return { ...newDoc.data(), id: newDoc.id, timestamp: newDoc.data()?.timestamp.toMillis() } as Session;
};

// Cập nhật một phiên làm việc
export const updateSession = (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return updateDoc(sessionDoc, { ...updates, timestamp: serverTimestamp() });
};

// Xóa một phiên làm việc
export const deleteSession = (userId: string, sessionId: string): Promise<void> => {
  const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
  return deleteDoc(sessionDoc);
};

// Tải nội dung tệp lên Firebase Storage
export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    const storageRef = ref(storage, `users/${userId}/sessions/${sessionId}/originalContent.txt`);
    await uploadString(storageRef, content);
    return getDownloadURL(storageRef);
};

// Lấy nội dung tệp từ Firebase Storage
export const getFileContent = async (url: string): Promise<string> => {
    const storageRef = ref(storage, url);
    // Lấy nội dung dưới dạng ArrayBuffer
    const bytes = await getBytes(storageRef);
    // Giải mã ArrayBuffer thành chuỗi UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
};


// Xóa nội dung tệp khỏi Firebase Storage
export const deleteFileContent = (url: string): Promise<void> => {
    if (!url) return Promise.resolve();
    try {
        const storageRef = ref(storage, url);
        return deleteObject(storageRef);
    } catch (error) {
        console.error("Lỗi khi xóa tệp:", error);
        // Không ném lỗi để không làm gián đoạn luồng của người dùng
        return Promise.resolve();
    }
};