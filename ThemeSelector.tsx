import React from 'react';
import type { Theme } from './types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ContrastIcon } from './icons/ContrastIcon';

interface ThemeSelectorProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showLabels?: boolean;
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Sáng', icon: <SunIcon className="w-4 h-4" /> },
  { value: 'dark', label: 'Tối', icon: <MoonIcon className="w-4 h-4" /> },
  { value: 'contrast', label: 'Tương phản', icon: <ContrastIcon className="w-4 h-4" /> },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme, showLabels = true }) => {
  return (
    <div>
      <span id="theme-label" className="sr-only">Chọn chủ đề</span>
      <div role="group" aria-labelledby="theme-label" className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            title={option.label}
            role="radio"
            aria-checked={theme === option.value}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-900
              ${theme === option.value
                ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }
            `}
          >
            {option.icon}
            {showLabels && <span className="hidden sm:inline">{option.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};