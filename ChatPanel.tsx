import React, { useState, useMemo, useEffect } from 'react';
import type { Session, SummaryLength } from './types';
import { NotebookDisplay } from './ChatDisplay';
import { ChatInput } from './ChatInput';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { RectangleStackIcon } from './icons/RectangleStackIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';
import { FlashcardsPanel } from './FlashcardsPanel';
import { QuizPanel } from './QuizPanel';
import { Loader } from './Loader';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TocSelector } from './TocSelector';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface WorkspacePanelProps {
  session: Session;
  isSummaryLoading: boolean;
  isChatLoading: boolean;
  isRewriting: boolean;
  onRewrite: (newLength: SummaryLength) => void;
  onSendMessage: (message: string) => void;
  followUpLength: SummaryLength;
  setFollowUpLength: (length: SummaryLength) => void;
  onSourceClick: (uri: string) => void;
  updateCurrentSession: (updater: (session: Session) => Partial<Session>) => void;
  onStopGeneration: () => void;
  onSummarizeSections: (sections: string[]) => void;
  isSharedView: boolean;
}

type WorkspaceTab = 'notebook' | 'flashcards' | 'quiz' | 'toc';

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  session,
  isSummaryLoading,
  isChatLoading,
  isRewriting,
  onRewrite,
  onSendMessage,
  followUpLength,
  setFollowUpLength,
  onSourceClick,
  updateCurrentSession,
  onStopGeneration,
  onSummarizeSections,
  isSharedView,
}) => {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('notebook');
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

    const tabs: { id: WorkspaceTab, label: string, icon: React.ReactNode }[] = useMemo(() => {
        const baseTabs: { id: WorkspaceTab, label: string, icon: React.ReactNode }[] = [
            { id: 'notebook', label: 'Ghi chú', icon: <DocumentTextIcon className="w-4 h-4" /> },
            { id: 'flashcards', label: 'Thẻ ghi nhớ', icon: <RectangleStackIcon className="w-4 h-4" /> },
            { id: 'quiz', label: 'Kiểm tra', icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
        ];

        // Chỉ hiển thị tab Mục lục nếu có mục lục của tài liệu gốc.
        if (session.originalDocumentToc) {
            baseTabs.splice(1, 0, { id: 'toc', label: 'Mục lục', icon: <ListBulletIcon className="w-4 h-4" /> });
        }
        return baseTabs;
    }, [session.originalDocumentToc]);

    useEffect(() => {
        // Khi một mục lục được tạo lần đầu cho một tệp mới, hãy chuyển sang tab mục lục.
        if (session.originalDocumentToc && !session.summary) {
            setActiveTab('toc');
        } 
        // Nếu tab hiện tại ('toc') không còn hợp lệ (ví dụ: phiên mới không có mục lục),
        // hãy quay lại tab ghi chú.
        else if (activeTab === 'toc' && !session.originalDocumentToc) {
            setActiveTab('notebook');
        }
    }, [session.originalDocumentToc, session.summary, session.id, activeTab]);
    
    const renderTabContent = () => {
        const hasSuggestions = session.suggestedQuestions && session.suggestedQuestions.length > 0;
        const hasChatHistory = session.messages.length === 0 && !isChatLoading;

        const handleSuggestionClick = (question: string) => {
            onSendMessage(question);
            updateCurrentSession(s => ({ ...s, suggestedQuestions: [] }));
        };

        switch (activeTab) {
            case 'notebook':
                return (
                    <>
                        <NotebookDisplay 
                          session={session} 
                          isSummaryLoading={isSummaryLoading}
                          isChatLoading={isChatLoading}
                          isRewriting={isRewriting}
                          onRewrite={onRewrite}
                          onSourceClick={onSourceClick}
                          isSharedView={isSharedView}
                        />
                        <footer className="flex-shrink-0 p-1 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                           {hasSuggestions && hasChatHistory && !isSharedView && (
                                <div className="mb-0.5">
                                    <button 
                                        onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                                        className="flex items-center justify-between w-full text-left p-0.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        aria-expanded={isSuggestionsExpanded}
                                    >
                                        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Gợi ý tìm hiểu:</h4>
                                        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isSuggestionsExpanded ? '' : '-rotate-90'}`} />
                                    </button>
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSuggestionsExpanded ? 'max-h-96 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                                        <div className="flex flex-col gap-1 px-1">
                                            {session.suggestedQuestions!.map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(q)}
                                                    disabled={isSummaryLoading || isChatLoading}
                                                    className="w-full text-left p-1 bg-slate-100 dark:bg-slate-800/50 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                           )}
                           <ChatInput onSend={onSendMessage} disabled={isSummaryLoading || isChatLoading || isSharedView} summaryLength={followUpLength} onLengthChange={setFollowUpLength} />
                        </footer>
                    </>
                );
            case 'flashcards':
                return <FlashcardsPanel session={session} updateCurrentSession={updateCurrentSession} />;
            case 'quiz':
                return <QuizPanel session={session} updateCurrentSession={updateCurrentSession} />;
            case 'toc':
                // Tab này bây giờ CHỈ dành cho bộ chọn mục lục của tài liệu gốc
                if (session.originalDocumentToc) {
                    return (
                        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
                            <TocSelector 
                                tocMarkdown={session.originalDocumentToc}
                                fileName={session.fileName || 'document'}
                                onSummarize={(sections) => {
                                    onSummarizeSections(sections);
                                    setActiveTab('notebook');
                                }}
                                onCancel={() => setActiveTab('notebook')}
                                isLoading={isSummaryLoading}
                            />
                        </div>
                    );
                }
                return null; // Không nên xảy ra nếu tab hiển thị
            default:
                return null;
        }
    }

    if (isSummaryLoading && !isRewriting) {
        return (
          <div className="flex flex-col h-full bg-white dark:bg-slate-900 items-center justify-center">
            <Loader onStop={onStopGeneration} showTips={true} />
          </div>
        );
    }
    
    if (!session.summary && !isSummaryLoading && !session.originalDocumentToc) {
      return (
          <div className="flex flex-col h-full bg-white dark:bg-slate-900 items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <DocumentCheckIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Không gian làm việc của bạn</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  Tạo một bản tóm tắt để bắt đầu. Kết quả, ghi chú, và cuộc trò chuyện của bạn sẽ xuất hiện ở đây.
              </p>
          </div>
      );
    }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden`}>
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-0.5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 overflow-hidden">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={session.title}>
                    {session.title}
                </h2>
            </div>
        </header>
        
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
             <nav className="flex items-center justify-center p-0.5 bg-slate-100 dark:bg-slate-800/50" role="group">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        role="radio"
                        aria-checked={activeTab === tab.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-900
                            ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                            }
                        `}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
        
        <div className="flex-grow flex flex-col overflow-hidden">
            {renderTabContent()}
        </div>
    </div>
  );
};