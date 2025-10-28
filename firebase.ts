// FIX: Changed imports to use the Firebase compat library to resolve "module has no exported member" errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { isAiStudio } from './isAiStudio';

// FIX: Updated type annotations to use types from the compat library.
let appInstance: firebase.app.App | null = null;
let isInitialized = false;

interface FirebaseServices {
    // FIX: Updated type annotations for Firebase services.
    app: firebase.app.App | null;
    auth: firebase.auth.Auth | null;
    db: firebase.firestore.Firestore | null;
    googleProvider: firebase.auth.GoogleAuthProvider | null;
    isConfigured: boolean;
    firebaseEnabled: boolean;
}

/**
 * Khởi tạo và/hoặc trả về các dịch vụ Firebase.
 * Logic khởi tạo chỉ chạy một lần duy nhất.
 */
export const getFirebase = (): FirebaseServices => {
    if (isInitialized) {
        return {
            app: appInstance,
            // FIX: Switched from modular `getAuth(app)` to compat `firebase.auth()`.
            auth: appInstance ? firebase.auth() : null,
            // FIX: Switched from modular `getFirestore(app)` to compat `firebase.firestore()`.
            db: appInstance ? firebase.firestore() : null,
            // FIX: Switched from modular `new GoogleAuthProvider()` to compat `new firebase.auth.GoogleAuthProvider()`.
            googleProvider: appInstance ? new firebase.auth.GoogleAuthProvider() : null,
            isConfigured: !!appInstance,
            firebaseEnabled: !!appInstance,
        };
    }

    isInitialized = true; // Đánh dấu đã khởi tạo để không chạy lại khối này

    if (isAiStudio()) {
        return { app: null, auth: null, db: null, googleProvider: null, isConfigured: false, firebaseEnabled: false };
    }

    const firebaseConfig = {
        apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
        authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
        storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
    };
    
    const isConfigured = Object.values(firebaseConfig).every(value => value);

    if (isConfigured) {
        try {
            // FIX: Switched from modular `getApps().length` to compat `firebase.apps.length`.
            // FIX: Switched from modular `initializeApp(config)` to compat `firebase.initializeApp(config)`.
            if (!firebase.apps.length) {
                appInstance = firebase.initializeApp(firebaseConfig);
            } else {
                // FIX: Switched from modular `getApps()[0]` to compat `firebase.app()`.
                appInstance = firebase.app();
            }
            return {
                app: appInstance,
                // FIX: Switched to compat API calls for auth, firestore, and provider.
                auth: firebase.auth(),
                db: firebase.firestore(),
                googleProvider: new firebase.auth.GoogleAuthProvider(),
                isConfigured: true,
                firebaseEnabled: true,
            };
        } catch (e) {
            console.error("Lỗi khởi tạo Firebase:", e);
        }
    } else {
        console.error("Cấu hình Firebase bị thiếu.");
    }

    return { app: null, auth: null, db: null, googleProvider: null, isConfigured: false, firebaseEnabled: false };
};

/**
 * Một hàm riêng để lấy cấu hình cho bảng gỡ lỗi mà không gây ra tác dụng phụ.
 */
export const getFirebaseConfig = () => ({
    apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
});
