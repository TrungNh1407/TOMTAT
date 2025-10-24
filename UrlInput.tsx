
import React from 'react';
import { LinkIcon } from './icons/LinkIcon';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ value, onChange, placeholder, disabled }) => {
  return (
    <div className="w-full">
      <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Nhập URL
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <LinkIcon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          type="url"
          id="url-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full rounded-md border-slate-300 dark:border-slate-600 pl-10 shadow-sm focus:border-[--color-accent-500] focus:ring-[--color-accent-500] sm:text-sm py-3 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder-slate-500"
        />
      </div>
    </div>
  );
};