import React, { useRef } from 'react';
import type { Session, SummaryLength } from './types';
import { ChatMessage } from './ChatDisplay';
import { ChatInput } from './ChatInput';
import { SharedSessionBanner } from './SharedSessionBanner';

interface MobileChatPanelProps {
  session: Session;
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  followUpLength: SummaryLength;
  setFollowUpLength: (length: SummaryLength) => void;
  onStopGeneration: () => void;
  isSharedView: boolean;
}

export const MobileChatPanel: React.FC<MobileChatPanelProps> = ({
  session,
  isChatLoading,
  onSendMessage,
  followUpLength,
  setFollowUpLength,
  isSharedView,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate" title={session.title}>
          Trò chuyện: {session.title}
        </h2>
      </header>
       {isSharedView && <SharedSessionBanner />}

      <main className="flex-grow overflow-y-auto px-4">
        {session.messages.length === 0 && !isChatLoading ? (
             <div className="flex flex-col h-full items-center justify-center text-center p-4">
                <p className="text-slate-500 dark:text-slate-400">
                    {isSharedView ? "Đây là một phiên chỉ đọc." : "Đặt một câu hỏi tiếp theo về bản tóm tắt của bạn."}
                </p>
             </div>
        ) : (
            session.messages.map((msg, index) => (
                <ChatMessage 
                    key={index} 
                    message={msg} 
                    isLoading={isChatLoading && index === session.messages.length - 1}
                />
            ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex-shrink-0 py-1 px-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <ChatInput 
          onSend={onSendMessage} 
          disabled={isChatLoading || isSharedView} 
          summaryLength={followUpLength} 
          onLengthChange={setFollowUpLength} 
        />
      </footer>
    </div>
  );
};