import React from 'react';
import type { SummaryLength } from './types';

interface SummaryLengthSelectorProps {
  selectedLength: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
  disabled: boolean;
  label?: string;
  layout?: 'vertical' | 'horizontal';
}

const options: { value: SummaryLength; label: string; description: string }[] = [
  { value: 'short', label: 'Ngắn', description: 'Đọc và hiểu nhanh' },
  { value: 'medium', label: 'Trung bình', description: 'Đủ thông tin quan trọng' },
  { value: 'long', label: 'Dài', description: 'Chi tiết, không sót nội dung' },
];

export const SummaryLengthSelector: React.FC<SummaryLengthSelectorProps> = ({ 
  selectedLength, 
  onLengthChange, 
  disabled, 
  label = "Độ dài tóm tắt",
  layout = 'vertical'
}) => {
  return (
    <div className={layout === 'horizontal' ? 'flex items-center gap-1' : ''}>
      <span 
        id="summary-length-label" 
        className={`text-xs font-medium text-slate-700 dark:text-slate-300 ${layout === 'horizontal' ? 'flex-shrink-0 mr-1' : 'block mb-1 text-center sm:text-left'}`}
      >
        {label}
      </span>
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-px rounded-md" role="group" aria-labelledby="summary-length-label">
        {options.map((option, index) => (
          <React.Fragment key={option.value}>
            <button
              onClick={() => onLengthChange(option.value)}
              disabled={disabled}
              title={option.description}
              role="radio"
              aria-checked={selectedLength === option.value}
              className={`px-1.5 py-0 text-xs font-semibold rounded transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-800 w-full text-center
                ${selectedLength === option.value
                  ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              {option.label}
            </button>
            {index < options.length - 1 && <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-600 mx-1"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};