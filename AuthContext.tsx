import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, googleProvider, firebaseEnabled } from './firebase';

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
    if (!firebaseEnabled || !auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseEnabled || !auth || !googleProvider) {
        throw new Error("Firebase is not configured for authentication.");
    }
    setLoading(true);
    await signInWithPopup(auth, googleProvider);
    // setLoading(false) is handled by onAuthStateChanged
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
      if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user && displayName) {
          await updateProfile(userCredential.user, { displayName });
      }
  };
  
  const sendPasswordReset = async (email: string) => {
      if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
      await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (!firebaseEnabled || !auth) return;
    setLoading(true);
    try {
      await signOut(auth);
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
    // This can happen in AI Studio where AuthProvider is not used.
    // Return a default state that indicates no user and not loading.
    return {
        user: null,
        loading: false,
        signInWithGoogle: async () => { console.warn("Login function is not available in this mode."); },
        signInWithEmail: async () => { console.warn("Email sign-in is not available in this mode."); },
        signUpWithEmail: async () => { console.warn("Email sign-up is not available in this mode."); },
        sendPasswordResetEmail: async () => { console.warn("Password reset is not available in this mode."); },
        logout: async () => { console.warn("Logout function is not available in this mode."); },
    };
  }
  return context;
};