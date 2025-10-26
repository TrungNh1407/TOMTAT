import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from './firebase';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface AuthProps {
    onClose: () => void;
}

const Auth: React.FC<AuthProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSuccess = () => {
      setLoading(false);
      onClose();
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      handleSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      handleSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Địa chỉ email không hợp lệ.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email hoặc mật khẩu không chính xác.';
      case 'auth/email-already-in-use':
        return 'Địa chỉ email này đã được sử dụng.';
      case 'auth/weak-password':
        return 'Mật khẩu phải có ít nhất 6 ký tự.';
      case 'auth/popup-closed-by-user':
        return 'Cửa sổ đăng nhập đã bị đóng. Vui lòng thử lại.';
      default:
        return 'Đã xảy ra lỗi. Vui lòng thử lại.';
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
        aria-modal="true"
        role="dialog"
        onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 relative">
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center mb-6">
            <BrainCircuitIcon className="w-10 h-10 text-[--color-accent-600] dark:text-[--color-accent-400]" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-slab mt-2">Med.AI</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-center text-slate-700 dark:text-slate-200 mb-6">
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          
          {error && (
            <div className="mb-4 flex items-start p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-700/50">
                <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuthAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-[--color-accent-500] focus:ring-[--color-accent-500] sm:text-sm py-2 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-600 dark:text-slate-300">Mật khẩu</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-[--color-accent-500] focus:ring-[--color-accent-500] sm:text-sm py-2 dark:bg-slate-700 dark:text-slate-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[--color-accent-600] hover:bg-[--color-accent-700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5 mr-2" />
                Google
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="font-semibold text-[--color-accent-600] hover:text-[--color-accent-500]">
              {isLogin ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;