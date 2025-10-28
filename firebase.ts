import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isAiStudio } from './isAiStudio';

// Sửa lỗi: Sử dụng optional chaining (?.) để truy cập an toàn vào các biến môi trường.
// Điều này ngăn chặn lỗi crash nếu `import.meta.env` không được định nghĩa.
export const firebaseConfig = {
    apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
};

// Kiểm tra xem các biến môi trường có được định nghĩa không
export const isConfigured = Object.values(firebaseConfig).every(value => value);

let app;
// Chỉ khởi tạo Firebase nếu không ở trong AI Studio và cấu hình đã được cung cấp
if (!isAiStudio() && isConfigured) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
} else if (!isAiStudio() && !isConfigured) {
    console.error("Firebase config is missing. Please set up your environment variables. The app will run in offline mode.");
}


export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

// Export cờ này để các thành phần khác có thể kiểm tra
export const firebaseEnabled = !!app;