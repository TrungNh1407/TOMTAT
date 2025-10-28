import React, { createContext, useContext, useState, useEffect } from 'react';
// FIX: Changed imports to use the Firebase compat library to resolve "module has no exported member" errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirebase } from './firebase';

interface AuthContextType {
  // FIX: Updated User type to use the compat version from firebase.User.
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
  // FIX: Updated User type to use the compat version from firebase.User.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth, firebaseEnabled } = getFirebase();
    if (!firebaseEnabled || !auth) {
        setLoading(false);
        return;
    }
    // FIX: Switched from modular onAuthStateChanged(auth, ...) to compat auth.onAuthStateChanged(...)
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { auth, googleProvider, firebaseEnabled } = getFirebase();
    if (!firebaseEnabled || !auth || !googleProvider) {
        throw new Error("Firebase is not configured for authentication.");
    }
    setLoading(true);
    // FIX: Switched from modular signInWithPopup(auth, ...) to compat auth.signInWithPopup(...)
    await auth.signInWithPopup(googleProvider);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { auth, firebaseEnabled } = getFirebase();
    if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
    setLoading(true);
    // FIX: Switched from modular signInWithEmailAndPassword(auth, ...) to compat auth.signInWithEmailAndPassword(...)
    await auth.signInWithEmailAndPassword(email, pass);
  };
  
  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
      const { auth, firebaseEnabled } = getFirebase();
      if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
      setLoading(true);
      // FIX: Switched from modular createUserWithEmailAndPassword(auth, ...) to compat auth.createUserWithEmailAndPassword(...)
      const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
      if (userCredential.user && displayName) {
          // FIX: Switched from modular updateProfile(user, ...) to compat user.updateProfile(...)
          await userCredential.user.updateProfile({ displayName });
      }
  };
  
  const sendPasswordReset = async (email: string) => {
      const { auth, firebaseEnabled } = getFirebase();
      if (!firebaseEnabled || !auth) throw new Error("Firebase is not configured.");
      // FIX: Switched from modular sendPasswordResetEmail(auth, ...) to compat auth.sendPasswordResetEmail(...)
      await auth.sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    const { auth, firebaseEnabled } = getFirebase();
    if (!firebaseEnabled || !auth) return;
    setLoading(true);
    try {
      // FIX: Switched from modular signOut(auth) to compat auth.signOut()
      await auth.signOut();
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
