import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrompt: string) => void;
  onReset: () => void;
  initialPrompt: string;
}

type EditorTheme = 'light' | 'dark';
type EditorFontSize = 'xs' | 'sm' | 'base';

const fontSizeOptions: { value: EditorFontSize; label: string; title: string }[] = [
  { value: 'xs', label: 'Nhỏ', title: 'Cỡ chữ nhỏ' },
  { value: 'sm', label: 'Vừa', title: 'Cỡ chữ vừa' },
  { value: 'base', label: 'Lớn', title: 'Cỡ chữ lớn' },
];

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({ isOpen, onClose, onSave, onReset, initialPrompt }) => {
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt);
  const [theme, setTheme] = useState<EditorTheme>('light');
  const [fontSize, setFontSize] = useState<EditorFontSize>('sm');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('promptEditorTheme') as EditorTheme | null;
    const savedFontSize = localStorage.getItem('promptEditorFontSize') as EditorFontSize | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  useEffect(() => {
    setCurrentPrompt(initialPrompt);
  }, [initialPrompt, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleThemeChange = (newTheme: EditorTheme) => {
    setTheme(newTheme);
    localStorage.setItem('promptEditorTheme', newTheme);
  };
  
  const handleFontSizeChange = (newSize: EditorFontSize) => {
    setFontSize(newSize);
    localStorage.setItem('promptEditorFontSize', newSize);
  };

  const handleSave = () => {
    onSave(currentPrompt);
  };

  const handleReset = () => {
    onReset();
    // The parent component will pass the new initialPrompt,
    // which the useEffect hook will use to update currentPrompt
  };
  
  const themeClasses = {
    light: 'bg-slate-50 text-slate-800 border-slate-300 focus:border-[--color-accent-500] focus:ring-[--color-accent-500]',
    dark: 'bg-slate-800 text-slate-200 border-slate-600 focus:border-[--color-accent-400] focus:ring-[--color-accent-400] caret-slate-50'
  };

  const fontSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base'
  };

  const isDark = theme === 'dark';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`flex items-center justify-between p-4 border-b flex-shrink-0 transition-colors ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-lg font-bold transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Chỉnh sửa Prompt Tóm tắt</h2>
          <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
            <XMarkIcon className="w-6 h-6" />
            <span className="sr-only">Đóng</span>
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto">
          <textarea
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            className={`w-full h-full min-h-[400px] p-3 border rounded-md shadow-sm transition font-mono
              ${themeClasses[theme]}
              ${fontSizeClasses[fontSize]}
            `}
            aria-label="Prompt editor"
          />
        </main>
        
        <footer className={`flex flex-col sm:flex-row items-center justify-between p-4 border-t rounded-b-xl gap-4 flex-shrink-0 transition-colors ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 sm:gap-4 self-start sm:self-center">
              <div>
                <span id="theme-label" className="sr-only">Chủ đề trình soạn thảo</span>
                <div role="group" aria-labelledby="theme-label" className={`flex items-center p-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <button onClick={() => handleThemeChange('light')} title="Chủ đề Sáng" className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white ring-1 ring-[--color-accent-500]' : 'hover:bg-white/60 dark:hover:bg-slate-600/60'}`}>
                        <SunIcon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}/>
                    </button>
                    <button onClick={() => handleThemeChange('dark')} title="Chủ đề Tối" className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-900 ring-1 ring-[--color-accent-500]' : 'hover:bg-white/60 dark:hover:bg-slate-600/60'}`}>
                        <MoonIcon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}/>
                    </button>
                </div>
              </div>
               <div>
                <span id="font-size-label" className="sr-only">Cỡ chữ</span>
                <div role="group" aria-labelledby="font-size-label" className={`flex items-center p-1 rounded-lg transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  {fontSizeOptions.map((option, index) => (
                    <React.Fragment key={option.value}>
                      <button
                        onClick={() => handleFontSizeChange(option.value)}
                        title={option.title}
                        role="radio"
                        aria-checked={fontSize === option.value}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 text-center
                          ${fontSize === option.value
                            ? (isDark ? 'bg-slate-900 text-[--color-accent-400] ring-1 ring-[--color-accent-500]' : 'bg-white text-[--color-accent-600] shadow-sm')
                            : (isDark ? 'text-slate-300 hover:bg-slate-600/60' : 'text-slate-600 hover:bg-white/60')
                          }
                        `}
                      >
                        {option.label}
                      </button>
                      {index < fontSizeOptions.length - 1 && <div className={`w-px h-4 mx-1 transition-colors ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}></div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
          </div>
          <div className="flex w-full sm:w-auto gap-3 self-end sm:self-center">
            <button
              onClick={handleReset}
              className={`px-4 py-2 text-sm font-semibold rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 w-full sm:w-auto
                ${isDark ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600 focus:ring-slate-500' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 focus:ring-slate-400'}
              `}
            >
              Đặt lại về mặc định
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
            >
              Lưu thay đổi
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
