import { db } from './firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import type { Session } from './types';

if (!db) {
  console.warn("Firestore is not initialized. Running in offline mode.");
}

// Helper function to get the collection references based on userId
const getSessionsCollection = (userId: string) => db ? collection(db, 'sessions', userId, 'sessions') : null;
const getContentsCollection = (userId: string) => db ? collection(db, 'sessionContents', userId, 'contents') : null;


export const getSessions = async (userId: string): Promise<Session[]> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return [];
  
  const q = query(
    sessionsCollection,
    orderBy('timestamp', 'desc'),
    limit(50)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
};

export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) throw new Error("Firestore is not available.");
  
  const docRef = await addDoc(sessionsCollection, {
    ...sessionData,
    userId, // Keep userId for data integrity, even though it's in the path
    timestamp: serverTimestamp(),
  });
  return { ...sessionData, id: docRef.id, userId, timestamp: Date.now() };
};

export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;
  const sessionDoc = doc(sessionsCollection, sessionId);
  await updateDoc(sessionDoc, updates);
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;
  const sessionDoc = doc(sessionsCollection, sessionId);
  await deleteDoc(sessionDoc);
  // Also delete associated file content
  await deleteFileContent(userId, sessionId);
};

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore is not available.");
    
    const contentDoc = doc(contentsCollection, sessionId);
    await setDoc(contentDoc, { content, userId }); // Include userId for security rules
    await updateSession(userId, sessionId, { originalContentUrl: sessionId });
    return sessionId; // The ID is the URL/reference
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore is not available.");

    const contentDoc = doc(contentsCollection, sessionId);
    const docSnap = await getDoc(contentDoc);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Security check (double-check in case rules are misconfigured)
        if (data.userId !== userId) {
            throw new Error("Permission denied to access file content.");
        }
        return data.content;
    }
    throw new Error("File content not found.");
};

export const deleteFileContent = async (userId: string, sessionId: string): Promise<void> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) return;
    const contentDoc = doc(contentsCollection, sessionId);
    await deleteDoc(contentDoc);
};