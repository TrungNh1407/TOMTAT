import React, { useMemo, useRef } from 'react';
import type { Message, Session, SummaryLength } from './types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RobotIcon } from './icons/RobotIcon';
import { UserIcon } from './icons/UserIcon';
import { StructuredNoteDisplay } from './StructuredNoteDisplay';
import { SourcesDisplay } from './SourcesDisplay';
import { SuccessDisplay } from './SuccessDisplay';
import { SummaryLengthSelector } from './SummaryLengthSelector';
import { WandIcon } from './icons/WandIcon';
import { Loader } from './Loader';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface ChatMessageProps {
  message: Message;
  isLoading: boolean;
}

const parseStructuredNote = (content: string) => {
    if (!content) return null;

    try {
        let jsonString = content;

        // Method 1: Look for ```json ... ``` block
        const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
        const blockMatch = jsonString.match(jsonBlockRegex);
        if (blockMatch && blockMatch[1]) {
            jsonString = blockMatch[1];
        } else {
            // Method 2: Clean <think> blocks
            jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/g, '');
        }

        // Method 3: Find the start of a JSON object or array
        const jsonStartIndex = jsonString.indexOf('{');
        const arrayStartIndex = jsonString.indexOf('[');

        if (jsonStartIndex === -1 && arrayStartIndex === -1) {
            return null; // No JSON object/array start found
        }
        
        let startIndex = -1;
        if (jsonStartIndex !== -1 && arrayStartIndex !== -1) {
            startIndex = Math.min(jsonStartIndex, arrayStartIndex);
        } else {
            startIndex = Math.max(jsonStartIndex, arrayStartIndex);
        }
        
        // Find the corresponding last closing bracket
        const startChar = jsonString[startIndex];
        const endChar = startChar === '{' ? '}' : ']';
        
        const lastEndIndex = jsonString.lastIndexOf(endChar);

        if (lastEndIndex <= startIndex) {
             // No valid end found. Could be a markdown link `[text]` with no JSON.
             // Or could be a partial stream. Don't attempt to parse.
            return null;
        }

        // Extract the potential JSON string from start to last corresponding bracket
        const potentialJson = jsonString.substring(startIndex, lastEndIndex + 1);
        
        return JSON.parse(potentialJson);

    } catch (e) {
        // This catch is for when JSON.parse fails. This is expected for partial streams
        // or if the heuristic fails on markdown that looks like JSON.
        // We return null to allow the UI to fallback to rendering as markdown.
        return null;
    }
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUserModel = message.role === 'user';

  const structuredNoteData = useMemo(() => {
    if (message.role === 'model' && message.content && typeof message.content === 'string') {
      return parseStructuredNote(message.content);
    }
    return null;
  }, [message.content, message.role]);

  const renderContent = () => {
    if (structuredNoteData) {
      return <StructuredNoteDisplay data={structuredNoteData} />;
    }
    return <MarkdownRenderer content={message.content} isLoading={isLoading} />;
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isUserModel ? '' : 'bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUserModel ? 'bg-slate-200 dark:bg-slate-700' : 'bg-[--color-accent-500]/20'}`}>
        {isUserModel ? (
          <UserIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        ) : (
          <RobotIcon className="w-5 h-5 text-[--color-accent-600] dark:text-[--color-accent-400]" />
        )}
      </div>
      <div className="flex-grow pt-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

interface NotebookDisplayProps {
  session: Session;
  isSummaryLoading: boolean;
  isChatLoading: boolean;
  isRewriting: boolean;
  onRewrite: (newLength: SummaryLength) => void;
  onRegenerate: () => void;
  onSourceClick: (uri: string) => void;
  isSharedView?: boolean;
  onStopGeneration: () => void;
}

export const NotebookDisplay: React.FC<NotebookDisplayProps> = ({
  session,
  isSummaryLoading,
  isChatLoading,
  isRewriting,
  onRewrite,
  onRegenerate,
  onSourceClick,
  isSharedView,
  onStopGeneration,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const structuredNoteData = useMemo(() => {
    if (session.summary?.content && typeof session.summary.content === 'string') {
      return parseStructuredNote(session.summary.content);
    }
    return null;
  }, [session.summary?.content]);

  const renderSummaryContent = () => {
    if (!session.summary?.content && !isSummaryLoading) return null;
    const isLoading = isSummaryLoading || isRewriting;

    const summaryControls = (
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
        <SuccessDisplay 
          session={session}
          summaryContent={session.summary!.content} 
          originalFileName={session.fileName || session.url || 'summary'}
        />
        {!isSharedView && (
            <div className="flex items-center gap-3 py-1">
                <div className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                    <WandIcon className="w-4 h-4 mr-1.5" />
                    <span>Tùy chọn</span>
                </div>
                {isRewriting ? (
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="w-3 h-3 border-2 border-[--color-accent-500] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang viết lại...
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <SummaryLengthSelector 
                            selectedLength={'medium'}
                            onLengthChange={onRewrite}
                            disabled={isLoading || isSharedView}
                            layout="horizontal"
                            label="Viết lại"
                        />
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <button
                            onClick={onRegenerate}
                            disabled={isLoading || isSharedView}
                            title="Tạo lại tóm tắt"
                            className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <ArrowPathIcon className="w-4 h-4"/>
                            <span>Tạo lại</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    );

    if (structuredNoteData) {
      return (
        <div>
          <StructuredNoteDisplay data={structuredNoteData} />
          {summaryControls}
        </div>
      );
    }

    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <MarkdownRenderer content={session.summary!.content} isLoading={isLoading} />
        {summaryControls}
      </div>
    );
  };

  return (
    <div className="flex-grow overflow-y-auto px-4 sm:px-6 py-4">
        {(isSummaryLoading || session.summary) && (
          <div className="mb-6">
            {renderSummaryContent()}
          </div>
        )}
        
        {session.messages.map((msg, index) => (
            <ChatMessage
                key={index}
                message={msg}
                isLoading={isChatLoading && index === session.messages.length - 1}
            />
        ))}
        <div ref={messagesEndRef} />
    </div>
  );
};
