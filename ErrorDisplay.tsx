
import React from 'react';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { HomeIcon } from './icons/HomeIcon';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry, onStartOver }) => {
  return (
    <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg flex flex-col items-center justify-center text-center">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
      <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Đã xảy ra lỗi</h3>
      <p className="text-sm text-red-700 dark:text-red-300 mt-2 max-w-lg">{message}</p>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onStartOver}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500 transition-colors"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Bắt đầu lại
        </button>
        <button
          onClick={onRetry}
          className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Thử lại
        </button>
      </div>
    </div>
  );
};
