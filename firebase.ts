import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { isAiStudio } from './isAiStudio';

interface FirebaseServices {
    app: firebase.app.App;
    auth: firebase.auth.Auth;
    db: firebase.firestore.Firestore;
    googleProvider: firebase.auth.GoogleAuthProvider;
}

let services: FirebaseServices | null = null;
let initialized = false;

/**
 * Lấy cấu hình Firebase từ các biến môi trường.
 */
export const getFirebaseConfig = () => ({
    apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
});

/**
 * Khởi tạo Firebase. Hàm này nên được gọi một lần ở gốc của ứng dụng.
 * Trả về true nếu khởi tạo thành công, ngược lại trả về false.
 */
export function initializeFirebase(): boolean {
    if (initialized) {
        return services !== null;
    }
    initialized = true;

    if (isAiStudio()) {
        return false;
    }

    const firebaseConfig = getFirebaseConfig();
    const isConfigured = Object.values(firebaseConfig).every(value => !!value);

    if (isConfigured) {
        try {
            const app = firebase.initializeApp(firebaseConfig);
            services = {
                app: app,
                auth: firebase.auth(),
                db: firebase.firestore(),
                googleProvider: new firebase.auth.GoogleAuthProvider(),
            };
            return true;
        } catch (e) {
            console.error("Lỗi khởi tạo Firebase:", e);
            services = null;
            return false;
        }
    } else {
        console.warn("Cấu hình Firebase bị thiếu hoặc không đầy đủ.");
        return false;
    }
}

/**
 * Lấy các dịch vụ Firebase đã được khởi tạo. Trả về null nếu chưa được khởi tạo.
 */
export const getFirebaseServices = (): FirebaseServices | null => {
    return services;
};

/**
 * Kiểm tra xem các dịch vụ Firebase đã được khởi tạo và có sẵn hay không.
 */
export const isFirebaseEnabled = (): boolean => {
    return services !== null;
};

/**
 * Kiểm tra xem các biến cấu hình Firebase có tồn tại hay không.
 */
export const isFirebaseConfigured = (): boolean => {
    const config = getFirebaseConfig();
    return Object.values(config).every(value => !!value);
}
