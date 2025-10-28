import React from 'react';
import { useAuth } from './AuthContext';
import { GoogleIcon } from './icons/GoogleIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

export const Auth: React.FC = () => {
  const { login, loading } = useAuth();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4">
        <div className="flex justify-center items-center gap-2 mb-4">
            <BrainCircuitIcon className="w-8 h-8 text-[--color-accent-600] dark:text-[--color-accent-400]" />
            <div className="flex items-baseline gap-1.5">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-slab">Med.AI</h1>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">by dr.HT</span>
            </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Đăng nhập để lưu và đồng bộ hóa các phiên làm việc của bạn.
        </p>
        <button
          onClick={login}
          disabled={loading}
          className="w-full flex items-center justify-center px-5 py-3 bg-white text-slate-700 font-semibold rounded-md shadow-md hover:bg-slate-50 border border-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <GoogleIcon className="w-5 h-5 mr-3" />
              <span>Đăng nhập với Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
