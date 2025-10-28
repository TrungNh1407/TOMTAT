import React, { useState } from 'react';
import type { Session, InputType, SummaryLength, Theme, Settings, OutputFormat } from './types';
import { HistoryPanel } from './HistoryPanel';
import { SourceInputs } from './SourceInputs';
import { ChevronDoubleLeftIcon } from './icons/ChevronDoubleLeftIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ThemeSelector } from './ThemeSelector';
import { SettingsModal } from './SettingsModal';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ChevronDoubleRightIcon } from './icons/ChevronDoubleRightIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { AuthStatus } from './AuthStatus';

interface LeftPanelProps {
  sessions: Session[];
  currentSession: Session;
  loadSession: (id: string) => void;
  createNewSession: () => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  onFileSelect: (file: File) => void;
  onUrlChange: (url: string) => void;
  onTabChange: (type: InputType) => void;
  onStartSummarization: () => void;
  onClearFile: () => void;
  fileProgress: { percent: number; detail: string } | null;
  error: string | null;
  isLoading: boolean;
  model: string;
  setModel: (model: string) => void;
  summaryLength: SummaryLength;
  setSummaryLength: (length: SummaryLength) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  availableModels: { [provider: string]: string[] };
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onSummarizeSections: (sections: string[]) => void;
  onOpenPromptEditor: () => void;
  fileSummaryMethod: 'full' | 'toc';
  setFileSummaryMethod: (method: 'full' | 'toc') => void;
  isCollapsed: boolean;
  onPanelCollapse: () => void;
  isFileReady: boolean;
  setToastMessage: (message: string) => void;
  isStudio: boolean;
  onStopGeneration: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'source' | 'history'>('source');
    
    if (props.isCollapsed) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-2 items-center">
                <button 
                    onClick={props.onPanelCollapse} 
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" 
                    title="Mở rộng bảng điều khiển"
                >
                    <ChevronDoubleRightIcon className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center justify-center">
                    <span className="font-semibold -rotate-90 whitespace-nowrap text-slate-500 dark:text-slate-400">Bảng điều khiển</span>
                </div>
            </div>
        )
    }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
        <header className="p-3 flex-shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <BrainCircuitIcon className="w-6 h-6 text-[--color-accent-600] dark:text-[--color-accent-400]" />
                <div className="flex items-baseline gap-1.5">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-slab">Med.AI</h1>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">by dr.HT</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <ThemeSelector theme={props.theme} setTheme={props.setTheme} showLabels={false} />
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Cài đặt hiển thị">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
                <button onClick={props.onPanelCollapse} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Thu gọn bảng điều khiển">
                    <ChevronDoubleLeftIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
        
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex gap-2 px-4" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('source')}
                    className={`flex-shrink-0 flex items-center whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-t-md ${
                        activeTab === 'source'
                        ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                    }`}
                >
                    <BookOpenIcon className="w-5 h-5 mr-2" />
                    Nguồn
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-shrink-0 flex items-center whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-t-md ${
                        activeTab === 'history'
                        ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                    }`}
                >
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Lịch sử
                </button>
            </nav>
        </div>

        <div className="flex-grow overflow-y-auto">
            {activeTab === 'source' && (
                <div className="p-4">
                    <SourceInputs
                        currentSession={props.currentSession}
                        onFileSelect={props.onFileSelect}
                        onUrlChange={props.onUrlChange}
                        onTabChange={props.onTabChange}
                        onStartSummarization={props.onStartSummarization}
                        onClearFile={props.onClearFile}
                        fileProgress={props.fileProgress}
                        error={props.error}
                        isLoading={props.isLoading}
                        model={props.model}
                        setModel={props.setModel}
                        summaryLength={props.summaryLength}
                        setSummaryLength={props.setSummaryLength}
                        outputFormat={props.outputFormat}
                        setOutputFormat={props.setOutputFormat}
                        availableModels={props.availableModels}
                        onSummarizeSections={props.onSummarizeSections}
                        isMobile={false}
                        theme={props.theme}
                        setTheme={props.setTheme}
                        settings={props.settings}
                        onSettingsChange={props.onSettingsChange}
                        onOpenPromptEditor={props.onOpenPromptEditor}
                        fileSummaryMethod={props.fileSummaryMethod}
                        setFileSummaryMethod={props.setFileSummaryMethod}
                        isFileReady={props.isFileReady}
                        setToastMessage={props.setToastMessage}
                        isStudio={props.isStudio}
                        onStopGeneration={props.onStopGeneration}
                    />
                </div>
            )}
            {activeTab === 'history' && (
                <HistoryPanel
                    sessions={props.sessions}
                    currentSession={props.currentSession}
                    loadSession={props.loadSession}
                    createNewSession={props.createNewSession}
                    deleteSession={props.deleteSession}
                    renameSession={props.renameSession}
                />
            )}
        </div>
        
        {!props.isStudio && (
          <footer className="flex-shrink-0 p-2 border-t border-slate-200 dark:border-slate-700">
            <AuthStatus />
          </footer>
        )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={props.settings}
        onSettingsChange={props.onSettingsChange}
      />
    </div>
  );
};
