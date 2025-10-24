import React from 'react';
import type { OutputFormat } from './types';

interface OutputFormatSelectorProps {
  selectedFormat: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
  disabled: boolean;
}

const options: { value: OutputFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'structured', label: 'Ghi Chú Cấu Trúc' },
];

export const OutputFormatSelector: React.FC<OutputFormatSelectorProps> = ({ selectedFormat, onFormatChange, disabled }) => {
  return (
    <div>
      <span 
        id="output-format-label" 
        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 text-center sm:text-left"
      >
        Định dạng
      </span>
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg" role="group" aria-labelledby="output-format-label">
        {options.map((option, index) => (
            <React.Fragment key={option.value}>
              <button
                onClick={() => onFormatChange(option.value)}
                disabled={disabled}
                role="radio"
                aria-checked={selectedFormat === option.value}
                className={`flex-1 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-800 w-full text-center
                  ${selectedFormat === option.value
                    ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                `}
              >
                {option.label}
              </button>
              {index < options.length - 1 && <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>}
            </React.Fragment>
        ))}
      </div>
    </div>
  );
};