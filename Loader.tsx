

import React, { useState, useEffect } from 'react';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { LOADING_TIPS } from './constants';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface LoaderProps {
  onStop?: () => void;
  message?: string;
  showTips?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ onStop, message, showTips = false }) => {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * LOADING_TIPS.length));
  const [isFading, setIsFading] = useState(false);
  const [isTipsExpanded, setIsTipsExpanded] = useState(true);
  const [isTipsDismissed, setIsTipsDismissed] = useState(false);

  useEffect(() => {
    if (!showTips) return;
    
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTipIndex(prevIndex => (prevIndex + 1) % LOADING_TIPS.length);
        setIsFading(false);
      }, 300); // fade out duration
    }, 5000); // 5 seconds per tip

    return () => clearInterval(interval);
  }, [showTips]);

  if (isTipsDismissed) {
    showTips = false;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="w-12 h-12 border-4 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">{message || 'AI đang phân tích tài liệu...'}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quá trình này có thể mất một chút thời gian.</p>
      {onStop && (
        <button
          onClick={onStop}
          className="mt-6 flex items-center justify-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <StopCircleIcon className="w-5 h-5 mr-2" />
          Dừng lại
        </button>
      )}

      {showTips && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 w-full max-w-sm">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsTipsExpanded(!isTipsExpanded)}
              className="flex items-center text-left text-sm font-semibold text-slate-600 dark:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 flex-grow"
              aria-expanded={isTipsExpanded}
            >
              <LightBulbIcon className="w-5 h-5 mr-2 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
              <span className="flex-grow">Mẹo hữu ích</span>
              {isTipsExpanded ? <ChevronDownIcon className="w-4 h-4 ml-2 text-slate-500" /> : <ChevronRightIcon className="w-4 h-4 ml-2 text-slate-500" />}
            </button>
            <button
              onClick={() => setIsTipsDismissed(true)}
              className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 ml-2"
              aria-label="Đóng mẹo"
            >
               <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div 
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isTipsExpanded ? 'max-h-40 mt-2' : 'max-h-0'}`}
          >
            <p className={`text-sm text-center text-slate-500 dark:text-slate-400 transition-opacity duration-300 ease-in-out min-h-[40px] flex items-center justify-center ${isFading ? 'opacity-0' : 'opacity-100'}`}>
              {LOADING_TIPS[tipIndex]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};