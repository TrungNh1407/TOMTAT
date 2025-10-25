import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// QUAN TRỌNG: Thay thế các giá trị dưới đây bằng cấu hình dự án Firebase của bạn.
// Bạn có thể tìm thấy thông tin này trong Bảng điều khiển Firebase > Cài đặt dự án.
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất các dịch vụ Firebase đã được khởi tạo để sử dụng trong toàn bộ ứng dụng
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
