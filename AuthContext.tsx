import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { isAiStudio } from './isAiStudio';

// Định nghĩa một kiểu người dùng mở rộng có thể bao gồm cờ isGuest
export type User = (FirebaseUser & { isGuest?: boolean }) | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true,
    isAuthModalOpen: false,
    openAuthModal: () => {},
    closeAuthModal: () => {},
    logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Nếu đang ở trong AI Studio, bỏ qua xác thực Firebase và tạo người dùng giả
    if (isAiStudio()) {
      const studioUser: User = {
        uid: 'aistudio-user',
        isGuest: true,
      } as User;
      setUser(studioUser);
      setLoading(false);
      return;
    }

    // Nếu không có auth (Firebase chưa được cấu hình), tạo người dùng khách
    if (!auth) {
        const guestUser: User = {
            uid: 'guest-user',
            isGuest: true,
        } as User;
        setUser(guestUser);
        setLoading(false);
        return;
    }

    // Ngược lại, tiếp tục với luồng xác thực Firebase thông thường
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // Nếu không có người dùng đăng nhập, tạo một người dùng khách
        const guestUser: User = {
            uid: 'guest-user',
            isGuest: true,
        } as User;
        setUser(guestUser);
      }
      setLoading(false);
    });

    // Hủy lắng nghe khi component bị unmount
    return () => unsubscribe();
  }, []);
  
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const logout = async () => {
    if (auth) {
        await signOut(auth);
        // onAuthStateChanged sẽ tự động xử lý việc đặt lại thành người dùng khách
    }
  };

  const value = {
    user,
    loading,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};