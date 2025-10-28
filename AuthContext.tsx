import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from './supabaseClient';
import type { User, Session as SupabaseSession } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const performAuthAction = async (action: () => Promise<any>) => {
      if (!supabase) throw new Error("Supabase chưa được cấu hình.");
      try {
        const { error } = await action();
        if (error) throw error;
      } catch (error) {
        console.error("Lỗi xác thực Supabase:", error);
        throw error;
      }
  };

  const signInWithGoogle = async () => {
    await performAuthAction(() => 
      supabase!.auth.signInWithOAuth({
        provider: 'google',
      })
    );
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await performAuthAction(() => 
      // FIX: The shorthand property 'password' was not defined. Used 'password: pass' to correctly reference the function parameter.
      supabase!.auth.signInWithPassword({ email, password: pass })
    );
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    await performAuthAction(() => 
      supabase!.auth.signUp({
        email,
        // FIX: The shorthand property 'password' was not defined. Used 'password: pass' to correctly reference the function parameter.
        password: pass,
        options: {
          data: {
            full_name: displayName,
          },
        },
      })
    );
  };
  
  const sendPasswordResetEmail = async (email: string) => {
      await performAuthAction(() =>
        supabase!.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Người dùng sẽ được chuyển hướng trở lại ứng dụng sau khi đặt lại
        })
      );
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const value = { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Nếu không có AuthProvider (chế độ offline), trả về các hàm giả lập
    return {
      user: null,
      loading: false,
      signInWithGoogle: async () => console.warn("Chức năng đăng nhập không có sẵn trong chế độ này."),
      signInWithEmail: async () => console.warn("Đăng nhập bằng email không có sẵn trong chế độ này."),
      signUpWithEmail: async () => console.warn("Đăng ký bằng email không có sẵn trong chế độ này."),
      sendPasswordResetEmail: async () => console.warn("Đặt lại mật khẩu không có sẵn trong chế độ này."),
      logout: async () => console.warn("Chức năng đăng xuất không có sẵn trong chế độ này."),
    };
  }
  return context;
};
