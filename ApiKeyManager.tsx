import React, { useState, useEffect } from 'react';
import { KeyIcon } from './icons/KeyIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ApiKeyManagerProps {
  setToastMessage: (message: string) => void;
}

const STORAGE_KEY = 'geminiApiKeys';

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ setToastMessage }) => {
  const [keysInput, setKeysInput] = useState('');
  const [savedKeyCount, setSavedKeyCount] = useState(0);

  useEffect(() => {
    const storedKeys = localStorage.getItem(STORAGE_KEY);
    if (storedKeys) {
      try {
        const keys = JSON.parse(storedKeys);
        if (Array.isArray(keys)) {
          setSavedKeyCount(keys.length);
        }
      } catch (e) {
        console.error('Lỗi phân tích cú pháp khóa API đã lưu:', e);
      }
    }
  }, []);

  const handleSaveKeys = () => {
    const keys = keysInput
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keys.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
      setSavedKeyCount(keys.length);
      setToastMessage(`Đã lưu thành công ${keys.length} khóa API Gemini.`);
      setKeysInput('');
    } else {
        setToastMessage("Vui lòng nhập ít nhất một khóa API.");
    }
  };

  const handleClearKeys = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedKeyCount(0);
    setToastMessage('Đã xóa tất cả các khóa API Gemini đã lưu.');
  };

  return (
    <div className="space-y-3">
        <div>
            <label htmlFor="api-key-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quản lý Khóa API Gemini
            </label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyIcon className="w-4 h-4 text-slate-500" />
                </div>
                <textarea
                    id="api-key-input"
                    value={keysInput}
                    onChange={(e) => setKeysInput(e.target.value)}
                    placeholder="Dán các khóa API của bạn ở đây, mỗi khóa một dòng"
                    rows={3}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 pl-9 shadow-sm focus:border-[--color-accent-500] focus:ring-[--color-accent-500] sm:text-sm py-2 disabled:cursor-not-allowed dark:bg-slate-900/50 dark:text-slate-200 resize-y"
                />
            </div>
             <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Các khóa này được lưu trữ trong trình duyệt của bạn và sẽ được sử dụng dự phòng nếu một khóa không thành công.
            </p>
        </div>
        <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {savedKeyCount > 0 
                    ? `${savedKeyCount} khóa đã được lưu.` 
                    : "Chưa có khóa nào được lưu."
                }
            </div>
            <div className='flex items-center gap-2'>
                {savedKeyCount > 0 && (
                     <button
                        onClick={handleClearKeys}
                        className="flex items-center justify-center p-2 text-xs font-semibold rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50 dark:hover:bg-red-900/40 transition-colors"
                        title="Xóa tất cả các khóa đã lưu"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={handleSaveKeys}
                    className="px-4 py-2 text-xs font-semibold rounded-md border border-transparent bg-[--color-accent-600] text-white hover:bg-[--color-accent-700] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] transition-colors"
                >
                    Lưu Khóa
                </button>
            </div>
        </div>
    </div>
  );
};
