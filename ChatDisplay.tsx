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

    if (isSummaryLoading && !session.summary?.content) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg min-h-[200px] flex items-center justify-center">
                <Loader onStop={onStopGeneration} showTips={true} />
            </div>
        );
    }

    const summaryControls = (
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
        <SuccessDisplay 
          session={session}
          summaryContent={session.summary!.content} 
          originalFileName={session.fileName || session.url || 'summary'}
        />
        {!isSharedView && (
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                    <WandIcon className="w-3.5 h-3.5 mr-1.5" />
                    <span>Viết lại bản tóm tắt?</span>
                </div>
                {isRewriting ? (
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="w-3 h-3 border-2 border-[--color-accent-500] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang viết lại...
                    </div>
                ) : (
                    <SummaryLengthSelector 
                    selectedLength={'medium'}
                    onLengthChange={onRewrite}
                    disabled={isRewriting || isSharedView}
                    layout="horizontal"
                    />
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
        <MarkdownRenderer content={session.summary!.content} isLoading={isSummaryLoading || isRewriting} />
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