import React, { useState, useEffect } from 'react';
import { LOADING_TIPS } from './constants';
import { LightBulbIcon } from './icons/LightBulbIcon';

export const LoadingTips: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * LOADING_TIPS.length));
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTipIndex(prevIndex => (prevIndex + 1) % LOADING_TIPS.length);
        setIsFading(false);
      }, 300); // fade out duration
    }, 5000); // 5 seconds per tip

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
      <LightBulbIcon className="w-5 h-5 mr-3 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
      <p className={`transition-opacity duration-300 text-center ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        {LOADING_TIPS[tipIndex]}
      </p>
    </div>
  );
};