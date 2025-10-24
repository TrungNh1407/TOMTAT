import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ToastNotificationProps {
  message: string | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Tự động ẩn sau 5 giây

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed top-5 right-5 z-[100] w-full max-w-sm p-4 bg-green-500 text-white rounded-lg shadow-2xl flex items-center justify-between animate-slide-in-down"
      role="alert"
    >
      <div className="flex items-center">
        <CheckCircleIcon className="w-6 h-6 mr-3" />
        <p className="font-semibold">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-green-600 transition-colors"
        aria-label="Đóng thông báo"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
