import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { Session } from './types';
import { getFirebaseServices } from './firebase'; // Import hàm mới

const getDb = (): firebase.firestore.Firestore | null => {
  const services = getFirebaseServices();
  return services ? services.db : null;
};

// Helper function to get the collection references based on userId
const getSessionsCollection = (userId: string) => {
  const db = getDb();
  return db ? db.collection('sessions').doc(userId).collection('sessions') : null;
}
const getContentsCollection = (userId: string) => {
  const db = getDb();
  return db ? db.collection('sessionContents').doc(userId).collection('contents') : null;
}


export const getSessions = async (userId: string): Promise<Session[]> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return [];
  
  const q = sessionsCollection
    .orderBy('timestamp', 'desc')
    .limit(50);

  const querySnapshot = await q.get();
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
};

export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) throw new Error("Firestore không có sẵn.");
  
  const docRef = await sessionsCollection.add({
    ...sessionData,
    userId, 
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { ...sessionData, id: docRef.id, userId, timestamp: Date.now() };
};

export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;

  const sessionDoc = sessionsCollection.doc(sessionId);
  await sessionDoc.update(updates);
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;
  const sessionDoc = sessionsCollection.doc(sessionId);
  await sessionDoc.delete();
  await deleteFileContent(userId, sessionId);
};

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore không có sẵn.");
    
    const contentDoc = contentsCollection.doc(sessionId);
    await contentDoc.set({ content, userId });
    await updateSession(userId, sessionId, { originalContentUrl: sessionId });
    return sessionId;
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore không có sẵn.");

    const contentDoc = contentsCollection.doc(sessionId);
    const docSnap = await contentDoc.get();
    if (docSnap.exists) {
        const data = docSnap.data();
        if (data && data.userId !== userId) {
            throw new Error("Không có quyền truy cập nội dung tệp.");
        }
        return data ? data.content : "";
    }
    throw new Error("Không tìm thấy nội dung tệp.");
};

export const deleteFileContent = async (userId: string, sessionId: string): Promise<void> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) return;
    const contentDoc = contentsCollection.doc(sessionId);
    await contentDoc.delete();
};
