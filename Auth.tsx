import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { GoogleIcon } from './icons/GoogleIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

type AuthMode = 'signin' | 'signup' | 'forgotPassword';

// Hàm helper để dịch các thông báo lỗi của Supabase
const getSupabaseErrorMessage = (error: any): string => {
  if (error && typeof error.message === 'string') {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials')) {
      return 'Email hoặc mật khẩu không chính xác.';
    }
    if (msg.includes('user already registered')) {
      return 'Địa chỉ email này đã được sử dụng.';
    }
    if (msg.includes('password should be at least 6 characters')) {
      return 'Mật khẩu quá yếu. Vui lòng sử dụng ít nhất 6 ký tự.';
    }
    if (msg.includes('unable to validate email address')) {
        return 'Địa chỉ email không hợp lệ.';
    }
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
};

export const Auth: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản.');
      } else {
        await sendPasswordResetEmail(email);
        setMessage('Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
        setMode('signin');
      }
    } catch (err: any) {
      console.error("Lỗi xác thực:", err);
      setError(getSupabaseErrorMessage(err));
    } finally {
        setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err));
    } finally {
        setLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'forgotPassword') {
      return (
        <form onSubmit={handleAuthAction} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</p>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
          <button type="submit" disabled={loading} className="w-full auth-button bg-[--color-accent-600] text-white hover:bg-[--color-accent-700]">
            {loading ? <div className="auth-loader"></div> : 'Gửi liên kết'}
          </button>
        </form>
      );
    }
    
    return (
      <form onSubmit={handleAuthAction} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="displayName" className="sr-only">Tên hiển thị</label>
            <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tên hiển thị" required className="w-full auth-input" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full auth-input" />
        </div>
        <div>
          <label htmlFor="password"  className="sr-only">Mật khẩu</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu" required className="w-full auth-input" />
        </div>
        <button type="submit" disabled={loading} className="w-full auth-button bg-[--color-accent-600] text-white hover:bg-[--color-accent-700]">
          {loading ? <div className="auth-loader"></div> : (mode === 'signin' ? 'Đăng nhập' : 'Đăng ký')}
        </button>
      </form>
    );
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900 font-sans p-4">
      <style>{`
        .auth-input { @apply px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] dark:bg-slate-700 dark:border-slate-600 dark:text-white; }
        .auth-button { @apply flex items-center justify-center px-5 py-2.5 font-semibold rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] disabled:opacity-50 disabled:cursor-wait; }
        .auth-loader { @apply w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin; }
      `}</style>
      <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center items-center gap-2 mb-2">
            <BrainCircuitIcon className="w-8 h-8 text-[--color-accent-600] dark:text-[--color-accent-400]" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-slab">Med.AI</h1>
        </div>
        <p className="text-center text-slate-600 dark:text-slate-300 mb-6 text-sm">by dr.HT</p>

        {error && <p className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
        {message && <p className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm p-3 rounded-md mb-4 text-center">{message}</p>}

        {renderForm()}
        
        <div className="flex items-center my-4">
            <hr className="flex-grow border-slate-200 dark:border-slate-600" />
            <span className="mx-2 text-xs text-slate-400 dark:text-slate-500">HOẶC</span>
            <hr className="flex-grow border-slate-200 dark:border-slate-600" />
        </div>

        <button onClick={handleGoogleSignIn} disabled={loading} className="w-full auth-button bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
            {loading ? <div className="auth-loader"></div> : <><GoogleIcon className="w-5 h-5 mr-3" /><span>Tiếp tục với Google</span></>}
        </button>

        <div className="text-center mt-6 text-sm">
          {mode === 'signin' && (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('forgotPassword'); setError(null); }} className="text-[--color-accent-600] hover:underline">Quên mật khẩu?</a>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setError(null); }} className="font-semibold text-[--color-accent-600] hover:underline">Đăng ký</a></p>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-slate-500 dark:text-slate-400">Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setError(null); }} className="font-semibold text-[--color-accent-600] hover:underline">Đăng nhập</a></p>
          )}
           {mode === 'forgotPassword' && (
            <p className="text-slate-500 dark:text-slate-400">Nhớ mật khẩu? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setError(null); }} className="font-semibold text-[--color-accent-600] hover:underline">Đăng nhập</a></p>
          )}
        </div>
      </div>
    </div>
  );
};