import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isAiStudio } from './isAiStudio';

// Sửa lỗi: Sử dụng optional chaining (?.) để truy cập an toàn vào các biến môi trường.
// Điều này ngăn chặn lỗi crash nếu `import.meta.env` không được định nghĩa.
const firebaseConfig = {
    apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
};

// Kiểm tra xem các biến môi trường có được định nghĩa không
const isConfigured = Object.values(firebaseConfig).every(value => value);

let app;
// Chỉ khởi tạo Firebase nếu không ở trong AI Studio và cấu hình đã được cung cấp
if (!isAiStudio() && isConfigured) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
} else if (!isAiStudio() && !isConfigured) {
    // Hiển thị lỗi nếu đang ở môi trường production nhưng thiếu cấu hình
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #fff3f3; color: #b91c1c; height: 100vh; display: flex; align-items-center; justify-content: center;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: bold;">Lỗi Cấu hình Firebase</h1>
                    <p style="margin-top: 1rem;">Các biến môi trường Firebase không được thiết lập. Vui lòng kiểm tra tệp <code>.env.local</code> của bạn hoặc cài đặt môi trường trên Vercel.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #7f1d1d;">Tham khảo tệp <code>README.md</code> để biết hướng dẫn chi tiết.</p>
                </div>
            </div>
        `;
    }
    console.error("Firebase config is missing. Please set up your environment variables.");
}


export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

// Export cờ này để các thành phần khác có thể kiểm tra
export const firebaseEnabled = !!app;