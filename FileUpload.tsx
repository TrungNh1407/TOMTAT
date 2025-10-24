import React, { useRef, useState } from 'react';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
  fileName: string | null;
  onClearFile: () => void;
  fileProgress: { percent: number; detail: string } | null;
  isReady: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, fileName, onClearFile, fileProgress, isReady }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Đặt lại giá trị để cho phép tải lên cùng một tệp một lần nữa
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  if (fileName) {
    if (fileProgress !== null) {
      return (
        <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg space-y-2">
          <div className="flex items-center space-x-3 overflow-hidden">
            <DocumentTextIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={fileName}>
                {fileName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fileProgress.detail}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
            <div
              className="bg-[--color-accent-500] h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${fileProgress.percent}%` }}
              aria-valuenow={fileProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            ></div>
          </div>
        </div>
      );
    }
    const statusColor = isReady ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400';
    const statusIcon = isReady ? 
      <CheckCircleIcon className={`w-6 h-6 ${statusColor} flex-shrink-0`} /> : 
      <DocumentTextIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />;

    return (
      <div className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
        <div className="flex items-center space-x-3 overflow-hidden">
          {statusIcon}
          <div className="flex-grow overflow-hidden">
             <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={fileName}>
                {fileName}
              </p>
              {isReady && <p className={`text-xs font-semibold ${statusColor}`}>Tệp đã sẵn sàng</p>}
          </div>
        </div>
        <button
          onClick={onClearFile}
          disabled={disabled}
          className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 disabled:cursor-not-allowed transition-colors"
          aria-label="Xóa tệp"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative p-1 rounded-lg transition-colors duration-200 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-transparent'}`}
    >
      <input
        type="file"
        id="file-upload-input"
        onChange={handleFileChange}
        className="hidden"
        accept=".txt, .md, .rtf, .pdf, .html, .mhtml, text/html"
        disabled={disabled}
      />
      <div
        className={`w-full flex flex-col items-center justify-center px-6 py-6 border-2 border-dashed  rounded-lg text-center transition-colors duration-200 ${isDragging ? 'border-[--color-accent-500] dark:border-[--color-accent-400]' : 'border-slate-300 dark:border-slate-600'}`}
      >
        <DocumentArrowUpIcon className="w-6 h-6 mb-1.5 text-slate-400 dark:text-slate-500" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Kéo và thả tệp vào đây
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">hoặc</p>
        <label
          htmlFor="file-upload-input"
          className={`mt-2 px-4 py-1.5 bg-white dark:bg-slate-700 text-sm font-semibold text-[--color-accent-600] dark:text-[--color-accent-400] border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500] transition-colors duration-200 ${disabled ? 'bg-slate-100 dark:bg-slate-700 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          Chọn tệp từ máy tính
        </label>
      </div>
    </div>
  );
};