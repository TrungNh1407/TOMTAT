// FIX: Changed imports to use the Firebase compat library to resolve "module has no exported member" errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import type { Session } from './types';
import { getFirebase } from './firebase';

const getDb = () => getFirebase().db;

// Helper function to get the collection references based on userId
const getSessionsCollection = (userId: string) => {
  const db = getDb();
  // FIX: Switched from modular `collection(db, ...)` to compat `db.collection(...).doc(...).collection(...)` for subcollections.
  return db ? db.collection('sessions').doc(userId).collection('sessions') : null;
}
const getContentsCollection = (userId: string) => {
  const db = getDb();
  // FIX: Switched from modular `collection(db, ...)` to compat `db.collection(...).doc(...).collection(...)` for subcollections.
  return db ? db.collection('sessionContents').doc(userId).collection('contents') : null;
}


export const getSessions = async (userId: string): Promise<Session[]> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return [];
  
  // FIX: Switched from modular `query(collection, orderBy, limit)` to compat method chaining.
  const q = sessionsCollection
    .orderBy('timestamp', 'desc')
    .limit(50);

  // FIX: Switched from modular `getDocs(q)` to compat `q.get()`.
  const querySnapshot = await q.get();
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
};

export const addSession = async (userId: string, sessionData: Omit<Session, 'id'>): Promise<Session> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) throw new Error("Firestore is not available.");
  
  // FIX: Switched from modular `addDoc(collection, data)` to compat `collection.add(data)`.
  // FIX: Switched from modular `serverTimestamp()` to compat `firebase.firestore.FieldValue.serverTimestamp()`.
  const docRef = await addDoc(sessionsCollection, {
    ...sessionData,
    userId, 
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return { ...sessionData, id: docRef.id, userId, timestamp: Date.now() };
};

export const updateSession = async (userId: string, sessionId: string, updates: Partial<Session>): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;
  // FIX: Switched from modular `doc(collection, id)` to compat `collection.doc(id)`.
  // FIX: Switched from modular `updateDoc(docRef, data)` to compat `docRef.update(data)`.
  const sessionDoc = doc(sessionsCollection, sessionId);
  await updateDoc(sessionDoc, updates);
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const sessionsCollection = getSessionsCollection(userId);
  if (!sessionsCollection) return;
  // FIX: Switched from modular `doc(collection, id)` to compat `collection.doc(id)`.
  // FIX: Switched from modular `deleteDoc(docRef)` to compat `docRef.delete()`.
  const sessionDoc = doc(sessionsCollection, sessionId);
  await deleteDoc(sessionDoc);
  await deleteFileContent(userId, sessionId);
};

export const uploadFileContent = async (userId: string, sessionId: string, content: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore is not available.");
    
    // FIX: Switched from modular `doc(...)` and `setDoc(...)` to compat `.doc(...)` and `.set(...)`.
    const contentDoc = doc(contentsCollection, sessionId);
    await setDoc(contentDoc, { content, userId });
    await updateSession(userId, sessionId, { originalContentUrl: sessionId });
    return sessionId;
};

export const getFileContent = async (userId: string, sessionId: string): Promise<string> => {
    const contentsCollection = getContentsCollection(userId);
    if (!contentsCollection) throw new Error("Firestore is not available.");

    // FIX: Switched from modular `doc(...)` and `getDoc(...)` to compat `.doc(...)` and `.get(...)`.
    const contentDoc = doc(contentsCollection, sessionId);
    const docSnap = await getDoc(contentDoc);
    if (docSnap.exists()) {
        const data = docSnap.data();
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
    // FIX: Switched from modular `doc(...)` and `deleteDoc(...)` to compat `.doc(...)` and `.delete()`.
    const contentDoc = doc(contentsCollection, sessionId);
    await deleteDoc(contentDoc);
};
