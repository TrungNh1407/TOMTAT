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
  label, // Nhãn hiện được xử lý bởi thành phần cha
  layout = 'vertical' // Layout ít liên quan hơn nhưng vẫn giữ lại
}) => {
  return (
    <div className="flex items-center gap-1">
      {label && (
        <span 
          id="summary-length-label" 
          className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-shrink-0 mr-1"
        >
          {label}
        </span>
      )}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg" role="group" aria-label={label || "Độ dài tóm tắt"}>
        {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onLengthChange(option.value)}
              disabled={disabled}
              title={option.description}
              role="radio"
              aria-checked={selectedLength === option.value}
              className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-800 text-center
                ${selectedLength === option.value
                  ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
              `}
            >
              {option.label}
            </button>
        ))}
      </div>
    </div>
  );
};