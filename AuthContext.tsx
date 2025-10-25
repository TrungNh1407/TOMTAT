import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { isAiStudio } from './isAiStudio';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nếu đang ở trong AI Studio, bỏ qua xác thực Firebase
    if (isAiStudio()) {
      // Tạo một người dùng giả để các thành phần khác hoạt động
      const studioUser = {
        uid: 'aistudio-user',
        // Thêm các thuộc tính khác nếu cần, nhưng uid là quan trọng nhất
      } as User;
      setUser(studioUser);
      setLoading(false);
      return;
    }

    // Ngược lại, tiếp tục với luồng xác thực Firebase thông thường
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Hủy lắng nghe khi component bị unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
