

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import type { Settings } from './types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const fontSizes: { value: Settings['fontSize']; label: string }[] = [
  { value: 'sm', label: 'Nhỏ' },
  { value: 'base', label: 'Vừa' },
  { value: 'lg', label: 'Lớn' },
];

const accentColors: { value: Settings['accentColor']; label: string; class: string }[] = [
  { value: 'blue', label: 'Mặc định', class: 'bg-blue-600' },
  { value: 'green', label: 'Lá cây', class: 'bg-green-600' },
  { value: 'purple', label: 'Tím', class: 'bg-purple-600' },
  { value: 'orange', label: 'Cam', class: 'bg-orange-600' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    onSettingsChange(currentSettings);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] bg-white dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Cài đặt hiển thị</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
            <XMarkIcon className="w-6 h-6" />
            <span className="sr-only">Đóng</span>
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto space-y-6">
          <div>
            <label id="font-size-label" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cỡ chữ
            </label>
            <div role="group" aria-labelledby="font-size-label" className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setCurrentSettings(s => ({...s, fontSize: size.value}))}
                  role="radio"
                  aria-checked={currentSettings.fontSize === size.value}
                  className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-center
                    ${currentSettings.fontSize === size.value
                      ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }
                  `}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label id="accent-color-label" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Màu nhấn
            </label>
            <div role="group" aria-labelledby="accent-color-label" className="grid grid-cols-4 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setCurrentSettings(s => ({...s, accentColor: color.value}))}
                  role="radio"
                  aria-checked={currentSettings.accentColor === color.value}
                  aria-label={color.label}
                  className={`w-full aspect-square rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                    ${color.class}
                    ${currentSettings.accentColor === color.value ? 'ring-2 ring-[--color-accent-500] scale-105' : 'hover:opacity-80'}
                  `}
                />
              ))}
            </div>
          </div>
        </main>
        
        <footer className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-700 rounded-b-xl gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-md border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600 dark:focus:ring-slate-500 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-white font-semibold rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[--color-accent-600] hover:bg-[--color-accent-700] focus:ring-[--color-accent-500]"
            >
              Lưu
            </button>
        </footer>
      </div>
    </div>
  );
};