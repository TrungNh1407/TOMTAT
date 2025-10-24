import React from 'react';
import { ShareIcon } from './icons/ShareIcon';

export const SharedSessionBanner: React.FC = () => {
  return (
    <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 text-xs text-center">
      <div className="flex items-center justify-center">
        <ShareIcon className="w-4 h-4 mr-2" />
        <p>
          Bạn đang xem một phiên được chia sẻ. Chế độ chỉ đọc.
        </p>
      </div>
    </div>
  );
};
