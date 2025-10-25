import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { isAiStudio } from './isAiStudio';

const isStudio = isAiStudio();

// Đọc cấu hình Firebase từ các biến môi trường được cung cấp bởi Vercel (thông qua Vite).
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID
};

const hasApiKey = !!firebaseConfig.apiKey;

// Chỉ khởi tạo nếu không ở trong AI Studio VÀ có API key để tránh lỗi.
const app: FirebaseApp | undefined = !isStudio && hasApiKey ? initializeApp(firebaseConfig) : undefined;

export const auth: Auth | undefined = app ? getAuth(app) : undefined;
export const db: Firestore | undefined = app ? getFirestore(app) : undefined;
export const storage: FirebaseStorage | undefined = app ? getStorage(app) : undefined;

if (!isStudio && !hasApiKey) {
  console.error("Cấu hình Firebase bị thiếu. Hãy đảm bảo bạn đã thiết lập tệp .env hoặc các biến môi trường Vercel.");
}

export default app;
