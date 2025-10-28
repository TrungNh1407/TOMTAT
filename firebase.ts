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

// Biến cục bộ để lưu trữ các dịch vụ và trạng thái
let services: FirebaseServices | null = null;
let enabled = false;
let configured = false;
let configCache: any = {};

/**
 * Khởi tạo Firebase với một đối tượng cấu hình được cung cấp.
 * Hàm này chỉ nên được gọi một lần ở gốc của ứng dụng.
 * @param {object} firebaseConfig - Đối tượng cấu hình Firebase.
 * @returns {boolean} - Trả về true nếu khởi tạo thành công.
 */
export function initializeFirebase(firebaseConfig: any): boolean {
    if (enabled) {
        return true; // Đã được khởi tạo thành công
    }
    if (isAiStudio()) {
        enabled = false;
        configured = false;
        return false;
    }

    configCache = firebaseConfig; // Lưu lại để gỡ lỗi
    configured = Object.values(firebaseConfig).every(value => !!value);

    if (configured) {
        try {
            // Chỉ khởi tạo nếu chưa có ứng dụng nào
            if (!firebase.apps.length) {
                const app = firebase.initializeApp(firebaseConfig);
                services = {
                    app: app,
                    auth: firebase.auth(),
                    db: firebase.firestore(),
                    googleProvider: new firebase.auth.GoogleAuthProvider(),
                };
            }
            enabled = true;
            return true;
        } catch (e) {
            console.error("Lỗi khởi tạo Firebase:", e);
            services = null;
            enabled = false;
            return false;
        }
    } else {
        console.warn("Cấu hình Firebase bị thiếu hoặc không đầy đủ.");
        enabled = false;
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
    return enabled;
};

/**
 * Kiểm tra xem các biến cấu hình Firebase có tồn tại hay không.
 */
export const isFirebaseConfigured = (): boolean => {
    return configured;
};

/**
 * Trả về cấu hình đã được sử dụng để khởi tạo.
 */
export const getFirebaseConfig = (): any => {
    return configCache;
};