import React, { useState } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SaveToDriveButton } from './SaveToDriveButton';
import { ShareIcon } from './icons/ShareIcon';
import type { Session } from './types';
import { encodeSessionToUrl } from './shareUtils';

interface SuccessDisplayProps {
  summaryContent: string;
  originalFileName: string;
  session: Session;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({ summaryContent, originalFileName, session }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  let fileExtension = 'md';
  let mimeType = 'text/markdown';

  try {
    const trimmedContent = summaryContent.trim();
    if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) || (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
      JSON.parse(summaryContent);
      fileExtension = 'json';
      mimeType = 'application/json';
    }
  } catch (e) {
    fileExtension = 'md';
    mimeType = 'text/markdown';
  }


  const handleDownload = () => {
    if (!summaryContent) return;

    const blob = new Blob([summaryContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeFileName = originalFileName.replace(/\.[^/.]+$/, "");
    link.download = `${safeFileName}-summary.${fileExtension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!summaryContent) return;
    navigator.clipboard.writeText(summaryContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    setIsCreatingLink(true);
    try {
      const url = await encodeSessionToUrl(session);
      setShareableLink(url);
    } catch (error) {
      console.error("Failed to create shareable link:", error);
      alert("Không thể tạo liên kết chia sẻ.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink).then(() => {
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    });
  };

  const safeFileName = originalFileName.replace(/\.[^/.]+$/, "");
  const driveFileName = `${safeFileName}-summary.${fileExtension}`;

  return (
    <div className="px-2 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg flex flex-col items-center justify-between gap-2">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center">
          <DocumentCheckIcon className="w-4 h-4 text-green-600 dark:text-green-500 mr-1.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-xs text-green-800 dark:text-green-300">Tóm tắt thành công!</h3>
            <p className="text-xs text-green-700 dark:text-green-400">Bạn có thể sao chép, tải xuống hoặc lưu tóm tắt.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          <button
            onClick={handleShare}
            disabled={isCreatingLink}
            className="flex-1 sm:flex-none flex items-center justify-center px-2 py-1 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            {isCreatingLink ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShareIcon className="w-3.5 h-3.5 mr-1" />
                Chia sẻ
              </>
            )}
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none flex items-center justify-center px-2 py-1 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            {isCopied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 mr-1" />
                Đã chép
              </>
            ) : (
              <>
                <ClipboardIcon className="w-3.5 h-3.5 mr-1" />
                Sao chép
              </>
            )}
          </button>
          <SaveToDriveButton 
            fileName={driveFileName} 
            content={summaryContent}
            mimeType={mimeType}
          />
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center px-2 py-1 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <DownloadIcon className="w-3.5 h-3.5 mr-1" />
            Tải xuống
          </button>
        </div>
      </div>
      
      {shareableLink && (
        <div className="w-full mt-2 pt-2 border-t border-green-200 dark:border-green-700/50 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareableLink}
            className="w-full text-xs bg-green-100/50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 text-slate-600 dark:text-slate-300"
          />
          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 flex items-center justify-center px-2 py-1 bg-white dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            {isLinkCopied ? (
              <>
                <CheckIcon className="w-3.5 h-3.5 mr-1" />
                Đã chép
              </>
            ) : (
              <>
                <ClipboardIcon className="w-3.5 h-3.5 mr-1" />
                Sao chép
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};