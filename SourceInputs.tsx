import React, { useState } from 'react';
import type { Session, InputType, SummaryLength, Theme, Settings, OutputFormat } from './types';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';
import { LinkIcon } from './icons/LinkIcon';
import { YoutubeIcon } from './icons/YoutubeIcon';
import { FileUpload } from './FileUpload';
import { UrlInput } from './UrlInput';
import { SummaryLengthSelector } from './SummaryLengthSelector';
import { ModelSelector } from './ModelSelector';
import { SparklesIcon } from './icons/SparklesIcon';
import { SettingsModal } from './SettingsModal';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { ThemeSelector } from './ThemeSelector';
import { PencilIcon } from './icons/PencilIcon';
import { OutputFormatSelector } from './OutputFormatSelector';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { ApiKeyManager } from './ApiKeyManager';
import { MobileHistoryPanel } from './MobileHistoryPanel';
import { StopCircleIcon } from './icons/StopCircleIcon';

interface SourceInputsProps {
  currentSession: Session;
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
  onSummarizeSections: (sections: string[]) => void;
  isMobile: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onOpenPromptEditor: () => void;
  fileSummaryMethod: 'full' | 'toc';
  setFileSummaryMethod: (method: 'full' | 'toc') => void;
  isFileReady: boolean;
  onStopGeneration: () => void;
  // History props - optional as they are only used in mobile view
  sessions?: Session[];
  loadSession?: (id: string) => void;
  createNewSession?: () => void;
  deleteSession?: (id: string) => void;
  renameSession?: (id: string, newTitle: string) => void;
  // Toast prop for API key manager
  setToastMessage?: (message: string) => void;
  isStudio?: boolean;
}

export const SourceInputs: React.FC<SourceInputsProps> = (props) => {
  const {
    currentSession, onFileSelect, onUrlChange, onTabChange, onStartSummarization, onClearFile,
    fileProgress, error, isLoading, model, setModel,
    summaryLength, setSummaryLength, outputFormat, setOutputFormat, availableModels, fileSummaryMethod, setFileSummaryMethod,
    isMobile, theme, setTheme, settings, onSettingsChange, onOpenPromptEditor, isFileReady, setToastMessage, isStudio,
    onStopGeneration
  } = props;
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<'source' | 'history'>(() => {
    if (!isMobile || !props.sessions) return 'source';
    return props.sessions.some(s => s.summary || s.messages.length > 0 || s.title !== 'Cuộc trò chuyện mới') ? 'history' : 'source';
  });

  const tabs: { type: InputType; icon: React.ReactNode; label: string }[] = [
    { type: 'file', icon: <DocumentArrowUpIcon className="w-5 h-5 mr-2" />, label: 'Tệp' },
    { type: 'web', icon: <LinkIcon className="w-5 h-5 mr-2" />, label: 'Web' },
    { type: 'youtube', icon: <YoutubeIcon className="w-5 h-5 mr-2" />, label: 'YouTube' },
  ];

  const sourceContent = (
    <div className="flex flex-col gap-4">
        
        <div>
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex gap-4" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => onTabChange(tab.type)}
                  disabled={isLoading}
                  className={`flex-shrink-0 flex items-center whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-t-md
                    ${
                      currentSession.inputType === tab.type
                        ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600'
                    }
                    ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
                  `}
                  aria-current={currentSession.inputType === tab.type ? 'page' : undefined}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-5 animate-fade-in">
            {currentSession.inputType === 'file' && (
              <FileUpload onFileSelect={onFileSelect} disabled={isLoading} fileName={currentSession.fileName} onClearFile={onClearFile} fileProgress={fileProgress} isReady={isFileReady} />
            )}
            {currentSession.inputType === 'web' && (
              <UrlInput value={currentSession.url} onChange={onUrlChange} placeholder="https://example.com/article" disabled={isLoading} />
            )}
            {currentSession.inputType === 'youtube' && (
              <UrlInput value={currentSession.url} onChange={onUrlChange} placeholder="https://www.youtube.com/watch?v=..." disabled={isLoading} />
            )}
          </div>
        </div>
        
        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
        
        <div className="space-y-4">
            <div className="space-y-3">
                {currentSession.inputType === 'file' && currentSession.originalContent && (
                  <div>
                    <span 
                      id="summary-method-label" 
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 text-center sm:text-left"
                    >
                      Phương pháp tóm tắt
                    </span>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg" role="group" aria-labelledby="summary-method-label">
                      {[
                        { value: 'toc', label: 'Theo Mục lục' },
                        { value: 'full', label: 'Toàn bộ' }
                      ].map((option, index, arr) => (
                        <React.Fragment key={option.value}>
                          <button
                            onClick={() => setFileSummaryMethod(option.value as 'toc' | 'full')}
                            disabled={isLoading}
                            role="radio"
                            aria-checked={fileSummaryMethod === option.value}
                            className={`flex-1 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] focus:ring-offset-1 dark:focus:ring-offset-slate-800 w-full text-center
                              ${fileSummaryMethod === option.value
                                ? 'bg-white dark:bg-slate-700 text-[--color-accent-600] dark:text-slate-100 shadow-sm'
                                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                              }
                              ${isLoading ? 'cursor-not-allowed opacity-60' : ''}
                            `}
                          >
                            {option.label}
                          </button>
                          {index < arr.length - 1 && <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
                <SummaryLengthSelector selectedLength={summaryLength} onLengthChange={setSummaryLength} disabled={isLoading} />
                <OutputFormatSelector selectedFormat={outputFormat} onFormatChange={setOutputFormat} disabled={isLoading} />
                <button
                  onClick={onOpenPromptEditor}
                  disabled={isLoading}
                  className="w-full text-left flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[--color-accent-600] dark:hover:text-[--color-accent-400] transition-colors p-1 rounded-md disabled:opacity-50"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa prompt</span>
                </button>
            </div>

            <div className="relative">
                <ModelSelector selectedModel={model} onModelChange={setModel} availableModels={availableModels} disabled={isLoading} />
            </div>
            
            {!isStudio && setToastMessage && <ApiKeyManager setToastMessage={setToastMessage} />}

            {model.includes('sonar') && (
                <div className="p-3 text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
                    Các yêu cầu API của Perplexity hiện đang được xử lý an toàn thông qua proxy của máy chủ.
                </div>
            )}
            
            {isLoading ? (
                <button
                    onClick={onStopGeneration}
                    className="w-full flex items-center justify-center px-5 py-2.5 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <StopCircleIcon className="w-5 h-5 mr-2" />
                    <span>Dừng lại</span>
                </button>
            ) : (
                <button
                    onClick={() => onStartSummarization()}
                    disabled={(currentSession.inputType === 'file' && !currentSession.originalContent) || (currentSession.inputType !== 'file' && !currentSession.url)}
                    className="w-full flex items-center justify-center px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    <span>Tạo tóm tắt</span>
                </button>
            )}
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
                <BrainCircuitIcon className="w-6 h-6 text-[--color-accent-600] dark:text-[--color-accent-400]" />
                <div className="flex items-baseline gap-1.5">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-slab">Med.AI</h1>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">by dr.HT</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <ThemeSelector theme={theme} setTheme={setTheme} showLabels={false} />
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Cài đặt hiển thị">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
                {mobileTab === 'history' && props.createNewSession && (
                    <button onClick={props.createNewSession} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        + Mới
                    </button>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 mt-4 border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setMobileTab('source')}
              className={`flex-shrink-0 whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-semibold transition-colors duration-200
                ${mobileTab === 'source'
                  ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`
              }
            >
              Nguồn
            </button>
            <button
              onClick={() => setMobileTab('history')}
              className={`flex-shrink-0 whitespace-nowrap pb-3 px-1 border-b-2 text-sm font-semibold transition-colors duration-200
                ${mobileTab === 'history'
                  ? 'border-[--color-accent-500] text-[--color-accent-600] dark:text-[--color-accent-400]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`
              }
            >
              Lịch sử
            </button>
          </nav>
        </div>

        <div className="flex-grow pt-4 overflow-y-auto">
            {mobileTab === 'source' ? sourceContent : (
              props.sessions && props.loadSession && props.deleteSession && props.renameSession && props.createNewSession && (
                <MobileHistoryPanel
                  sessions={props.sessions}
                  currentSession={currentSession}
                  loadSession={props.loadSession}
                  createNewSession={props.createNewSession}
                  deleteSession={props.deleteSession}
                  renameSession={props.renameSession}
                />
              )
            )}
        </div>
        
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>
    );
  }

  // Desktop view
  return (
    <>
      {sourceContent}
    </>
  );
};