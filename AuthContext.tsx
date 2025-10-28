import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirebaseServices } from './firebase'; // Import hàm mới

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy các dịch vụ sau khi chúng đã được khởi tạo ở cấp cao hơn
    const services = getFirebaseServices();
    if (!services) {
        setLoading(false);
        return; // Firebase không có sẵn, không làm gì cả.
    }
    const unsubscribe = services.auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createAuthFunction = (action: (services: NonNullable<ReturnType<typeof getFirebaseServices>>, ...args: any[]) => Promise<any>) => {
    return async (...args: any[]) => {
      const services = getFirebaseServices();
      if (!services) {
        throw new Error("Firebase chưa được khởi tạo hoặc cấu hình.");
      }
      setLoading(true);
      // try/finally được chuyển vào từng hàm để xử lý `setLoading` chính xác hơn
      await action(services, ...args);
    };
  };

  const signInWithGoogle = createAuthFunction(async (services) => {
    await services.auth.signInWithPopup(services.googleProvider);
  });

  const signInWithEmail = createAuthFunction(async (services, email, pass) => {
    await services.auth.signInWithEmailAndPassword(email, pass);
  });
  
  const signUpWithEmail = createAuthFunction(async (services, email, pass, displayName) => {
    const userCredential = await services.auth.createUserWithEmailAndPassword(email, pass);
    if (userCredential.user && displayName) {
      await userCredential.user.updateProfile({ displayName });
    }
  });
  
  const sendPasswordReset = createAuthFunction(async (services, email) => {
    await services.auth.sendPasswordResetEmail(email);
  });

  const logout = async () => {
    const services = getFirebaseServices();
    if (!services) return;
    setLoading(true);
    try {
      await services.auth.signOut();
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
        setLoading(false);
    }
  };

  const value = { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail: sendPasswordReset, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Trả về các hàm giả lập nếu không có AuthProvider (chế độ offline)
    return {
        user: null,
        loading: false,
        signInWithGoogle: async () => { console.warn("Chức năng đăng nhập không có sẵn trong chế độ này."); },
        signInWithEmail: async () => { console.warn("Đăng nhập bằng email không có sẵn trong chế độ này."); },
        signUpWithEmail: async () => { console.warn("Đăng ký bằng email không có sẵn trong chế độ này."); },
        sendPasswordResetEmail: async () => { console.warn("Đặt lại mật khẩu không có sẵn trong chế độ này."); },
        logout: async () => { console.warn("Chức năng đăng xuất không có sẵn trong chế độ này."); },
    };
  }
  return context;
};
