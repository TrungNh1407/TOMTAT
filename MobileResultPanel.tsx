import React, { useState, useMemo, useEffect } from 'react';
import type { Session, SummaryLength } from './types';
import { Loader } from './Loader';
import { DocumentCheckIcon } from './icons/DocumentCheckIcon';
import { YouTubeView } from './YouTubeView';
import { StructuredNoteDisplay } from './StructuredNoteDisplay';
import { SourcesDisplay } from './SourcesDisplay';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { RectangleStackIcon } from './icons/RectangleStackIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';
import { FlashcardsPanel } from './FlashcardsPanel';
import { QuizPanel } from './QuizPanel';
import { WandIcon } from './icons/WandIcon';
import { SuccessDisplay } from './SuccessDisplay';
import { SummaryLengthSelector } from './SummaryLengthSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TocSelector } from './TocSelector';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { SharedSessionBanner } from './SharedSessionBanner';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface MobileResultPanelProps {
  session: Session;
  isSummaryLoading: boolean;
  isRewriting: boolean;
  onRewrite: (newLength: SummaryLength) => void;
  onRegenerate: () => void;
  onSourceClick: (uri: string) => void;
  updateCurrentSession: (updater: (session: Session) => Partial<Session>) => void;
  onStopGeneration: () => void;
  onSummarizeSections: (sections: string[]) => void;
  isSharedView: boolean;
}

type ResultTab = 'notebook' | 'flashcards' | 'quiz' | 'toc';

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

const SummaryDisplay: React.FC<Omit<MobileResultPanelProps, 'updateCurrentSession' | 'onSummarizeSections'>> = (props) => {
    const { session, isSummaryLoading, isRewriting, onRewrite, onRegenerate, onSourceClick, isSharedView } = props;

    const isYouTube = session.inputType === 'youtube' && session.youtubeVideoId;
    
    const structuredNoteData = useMemo(() => {
        if (session.summary?.content && typeof session.summary.content === 'string') {
            return parseStructuredNote(session.summary.content);
        }
        return null;
    }, [session.summary?.content]);

    const renderSummaryContent = () => {
        if (!session.summary?.content) return null;
        const isLoading = isSummaryLoading || isRewriting;

        const summaryControls = !isSummaryLoading && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <SuccessDisplay 
                    session={session}
                    summaryContent={session.summary.content} 
                    originalFileName={session.fileName || session.url || 'summary'}
                />
                {!isSharedView && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 px-2">
                        <div className="flex items-center text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                        <WandIcon className="w-3.5 h-3.5 mr-1" />
                        Tùy chọn
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

        if (typeof session.summary.content === 'string') {
            return (
                <div className="py-4 space-y-4">
                    <MarkdownRenderer content={session.summary.content} isLoading={isSummaryLoading} />
                    {summaryControls}
                </div>
            );
        }

        return (
            <div className="py-4 space-y-2">
               <h3 className="font-semibold text-lg">Ghi Chú Cấu Trúc (JSON)</h3>
               <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-4 rounded-md whitespace-pre-wrap break-all">
                   <code>{JSON.stringify(session.summary.content ?? {}, null, 2)}</code>
                   {isSummaryLoading && <span className="inline-block w-2.5 h-4 bg-slate-700 dark:bg-slate-300 blinking-cursor ml-1" />}
               </pre>
               {summaryControls}
            </div>
       );
    }
    
    return (
        <div className="flex-grow flex flex-col h-full overflow-hidden">
            <main className="flex-grow overflow-y-auto px-4 sm:px-6">
                {isSharedView && <div className="pt-2"><SharedSessionBanner /></div>}
                {isYouTube && session.transcript && (
                  <YouTubeView videoId={session.youtubeVideoId!} transcript={session.transcript} />
                )}
                
                {renderSummaryContent()}

                {session.sources && session.sources.length > 0 && (
                    <div className="py-4">
                        <SourcesDisplay sources={session.sources} onSourceClick={onSourceClick} />
                    </div>
                )}
            </main>
        </div>
    );
};


export const MobileResultPanel: React.FC<MobileResultPanelProps> = (props) => {
    const { session, isSummaryLoading, onStopGeneration, isRewriting } = props;
    
    // 1. Loading state for initial summarization
    if (isSummaryLoading && !isRewriting) {
        return (
          <div className="flex flex-col h-full items-center justify-center p-4">
            <Loader onStop={onStopGeneration} showTips={true} />
          </div>
        );
    }
    
    // 2. Empty state (if loading is finished but there's no summary or TOC)
    if (!session.summary && !session.originalDocumentToc && !isSummaryLoading) {
      return (
          <div className="flex flex-col h-full items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <DocumentCheckIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Kết quả của bạn</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                  Bản tóm tắt, thẻ ghi nhớ và bài kiểm tra của bạn sẽ xuất hiện ở đây.
              </p>
          </div>
      );
    }

    // 3. Default state: Summary or TOC exists, show tabbed interface
    return <MobileResultPanelWithTabs {...props} />;
};

const MobileResultPanelWithTabs: React.FC<MobileResultPanelProps> = (props) => {
    const { session, updateCurrentSession, onSummarizeSections, isSummaryLoading, onStopGeneration } = props;
    const [activeTab, setActiveTab] = useState<ResultTab>('notebook');

    const tabs: { id: ResultTab, label: string, icon: React.ReactNode }[] = useMemo(() => {
        const baseTabs: { id: ResultTab, label: string, icon: React.ReactNode }[] = [
            { id: 'notebook', label: 'Ghi chú', icon: <DocumentTextIcon className="w-4 h-4" /> },
            { id: 'flashcards', label: 'Thẻ ghi nhớ', icon: <RectangleStackIcon className="w-4 h-4" /> },
            { id: 'quiz', label: 'Kiểm tra', icon: <ClipboardDocumentCheckIcon className="w-4 h-4" /> },
        ];
        if (session.originalDocumentToc) {
            baseTabs.splice(1, 0, { id: 'toc', label: 'Mục lục', icon: <ListBulletIcon className="w-4 h-4" /> });
        }
        return baseTabs;
    }, [session.originalDocumentToc]);

    useEffect(() => {
        // Automatically switch to TOC tab when it's generated
        if (session.originalDocumentToc && !session.summary) {
            setActiveTab('toc');
        } 
        // Fallback to notebook tab if TOC is no longer valid for the current session
        else if (activeTab === 'toc' && !session.originalDocumentToc) {
            setActiveTab('notebook');
        }
    }, [session.id, session.originalDocumentToc, session.summary, activeTab]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'notebook':
                return <SummaryDisplay {...props} />;
            case 'flashcards':
                return <FlashcardsPanel session={session} updateCurrentSession={updateCurrentSession} />;
            case 'quiz':
                return <QuizPanel session={session} updateCurrentSession={updateCurrentSession} />;
            case 'toc':
                if (session.originalDocumentToc) {
                    return (
                        <div className="h-full">
                           <TocSelector 
                              tocMarkdown={session.originalDocumentToc}
                              fileName={session.fileName || 'document'}
                              onSummarize={(sections) => {
                                onSummarizeSections(sections);
                                setActiveTab('notebook');
                              }}
                              onCancel={() => {
                                onStopGeneration();
                                setActiveTab('notebook');
                              }}
                              isLoading={isSummaryLoading}
                            />
                        </div>
                    );
                }
                return null;
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate" title={session.title}>
                    {session.title}
                </h2>
            </header>
            
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
                 <nav className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800/50" role="group">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            role="radio"
                            aria-checked={activeTab === tab.id}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-900
                                ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                                }
                            `}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                             <span className="sm:hidden">{tab.label}</span>
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
