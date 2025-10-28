import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import { isAiStudio } from './isAiStudio';
import { initializeFirebase } from './firebase'; // Import trình khởi tạo mới

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const AppWrapper: React.FC = () => {
  // Trạng thái này xác định xem chúng ta đã thử khởi tạo hay chưa.
  const [initAttempted, setInitAttempted] = useState(false);
  // Trạng thái này giữ kết quả của việc khởi tạo.
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  useEffect(() => {
    // Effect này chỉ chạy một lần khi mount.
    if (isAiStudio()) {
      setFirebaseAvailable(false);
    } else {
      // Khởi tạo Firebase và lưu trữ kết quả.
      const enabled = initializeFirebase();
      setFirebaseAvailable(enabled);
    }
    // Đánh dấu rằng việc khởi tạo đã được thử.
    setInitAttempted(true);
  }, []);

  // Trong khi chưa thử khởi tạo, hiển thị màn hình tải.
  if (!initAttempted) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">Đang khởi tạo ứng dụng...</p>
            </div>
        </div>
    );
  }

  // Sau khi khởi tạo, quyết định phiên bản nào của ứng dụng sẽ được render.
  if (firebaseAvailable) {
    // Nếu Firebase có sẵn, bọc ứng dụng bằng AuthProvider.
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  }

  // Nếu Firebase không có sẵn (AI Studio hoặc lỗi cấu hình), render App trực tiếp.
  return <App />;
};


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);