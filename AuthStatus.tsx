import React from 'react';
import { useAuth } from './AuthContext';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ArrowRightStartOnRectangleIcon } from './icons/ArrowRightStartOnRectangleIcon';

export const AuthStatus: React.FC = () => {
    const { user, logout, openAuthModal } = useAuth();
    
    if (!user || user.isGuest) {
        return (
             <button 
                onClick={openAuthModal}
                className="flex items-center px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500 transition-colors"
             >
                <UserCircleIcon className="w-4 h-4 mr-1.5" />
                Đăng nhập
             </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline truncate max-w-28" title={user.email || 'User'}>
                {user.email || 'User'}
            </span>
             <button
                onClick={logout}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Đăng xuất"
             >
                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
             </button>
        </div>
    );
}