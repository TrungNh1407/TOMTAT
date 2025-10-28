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
  const [initAttempted, setInitAttempted] = useState(false);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  useEffect(() => {
    if (isAiStudio()) {
      setFirebaseAvailable(false);
    } else {
      // Đọc cấu hình trực tiếp tại đây để đảm bảo các biến môi trường đã được tải
      const config = {
          apiKey: (import.meta as any)?.env?.VITE_FIREBASE_API_KEY,
          authDomain: (import.meta as any)?.env?.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: (import.meta as any)?.env?.VITE_FIREBASE_PROJECT_ID,
          storageBucket: (import.meta as any)?.env?.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: (import.meta as any)?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: (import.meta as any)?.env?.VITE_FIREBASE_APP_ID,
      };
      
      const enabled = initializeFirebase(config);
      setFirebaseAvailable(enabled);
    }
    setInitAttempted(true);
  }, []);

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

  if (firebaseAvailable) {
    return (
      <AuthProvider>
        <App />
      </AuthProvider>
    );
  }

  return <App />;
};


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);