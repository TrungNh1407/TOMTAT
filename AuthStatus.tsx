import React from 'react';
import { useAuth } from './AuthContext';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowRightStartOnRectangleIcon } from './icons/ArrowRightStartOnRectangleIcon';

export const AuthStatus: React.FC = () => {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center p-2">
        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Hoặc một nút đăng nhập thay thế
  }

  return (
    <div className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
      <div className="flex items-center gap-3 overflow-hidden">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User avatar" className="w-8 h-8 rounded-full" />
        ) : (
          <UserCircleIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" title={user.displayName || 'User'}>
            {user.displayName || 'User'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={user.email || ''}>
            {user.email}
          </p>
        </div>
      </div>
      <button
        onClick={logout}
        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
        title="Đăng xuất"
      >
        <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
