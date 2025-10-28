import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LeftPanel } from './LeftPanel';
import { WorkspacePanel } from './ChatPanel';
import { ErrorDisplay } from './ErrorDisplay';
import { ToastNotification } from './ToastNotification';
import { PromptEditorModal } from './PromptEditorModal';
import MobileNav from './MobileNav';
import { SourceInputs } from './SourceInputs';
import { MobileResultPanel } from './MobileResultPanel';
import { MobileChatPanel } from './MobileChatPanel';
import { SharedSessionBanner } from './SharedSessionBanner';
import type { Session, SummaryLength, InputType, Theme, Settings, OutputFormat, MobileView, Message } from './types';
import { streamChatResponse, streamTranscript, generateTitle, generateFollowUpQuestions, generateContent } from './aiService';
import type { StreamChunk } from './aiService';
import { TOC_EXTRACTION_PROMPT, promptConfigs, CHAT_SYSTEM_PROMPT } from './constants';
import { decodeSessionFromUrl } from './shareUtils';
import * as pdfjsLib from 'pdfjs-dist';
import * as storageService from './storageService';
import * as supabaseService from './supabaseService';
import { useAuth } from './AuthContext';
import { Auth } from './Auth';
import { isAiStudio } from './isAiStudio';
import { isSupabaseEnabled } from './supabaseClient';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';


pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;

const readPdfFile = async (file: File, onProgress: (progress: number, detail: string) => void): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    
    loadingTask.onProgress = (progressData: { loaded: number, total?: number }) => {
        if (progressData.total) {
            const percent = (progressData.loaded / progressData.total) * 100;
            onProgress(percent, `Đang tải tệp PDF... ${Math.round(percent)}%`);
        }
    };

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pageTexts = new Array(numPages);
    let pagesProcessed = 0;

    const processPage = async (pageNum: number) => {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            pageTexts[pageNum - 1] = pageText;
        } catch (error) {
            console.error(`Lỗi khi xử lý trang ${pageNum}:`, error);
            pageTexts[pageNum - 1] = '';
        } finally {
            pagesProcessed++;
            onProgress((pagesProcessed / numPages) * 100, `Đang trích xuất văn bản từ trang ${pagesProcessed}/${numPages}...`);
        }
    };

    const CONCURRENCY_LIMIT = 10;
    const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);
    
    for (let i = 0; i < pageNumbers.length; i += CONCURRENCY_LIMIT) {
        const chunk = pageNumbers.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(pageNum => processPage(pageNum)));
    }
    
    return pageTexts.join('\n\n');
};


const readFileAsText = (file: File, onProgress: (progress: number, detail: string) => void): Promise<string> => {
  if (file.type === 'application/pdf') {
      onProgress(0, 'Bắt đầu xử lý PDF...');
      return readPdfFile(file, onProgress);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = (event.loaded / event.total) * 100;
        onProgress(percent, `Đang đọc tệp... ${Math.round(percent)}%`);
      }
    };
    reader.readAsText(file);
  });
};

const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const createNewSession = (userId: string, outputFormat: OutputFormat = 'markdown'): Omit<Session, 'id'> => ({
  userId,
  title: 'Cuộc trò chuyện mới',
  summary: null,
  messages: [],
  sources: [],
  timestamp: Date.now(),
  fileName: null,
  inputType: 'file',
  url: '',
  youtubeVideoId: null,
  transcript: null,
  outputFormat,
  suggestedQuestions: [],
  originalContent: null,
  isShared: false,
});

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const AVAILABLE_MODELS = {
  'Google': ['gemini-2.5-flash', 'gemini-2.5-pro'],
  'Perplexity': [
      'sonar',
      'sonar-pro',
      'sonar-reasoning',
      'sonar-reasoning-pro',
      'sonar-deep-research'
  ],
};

type AppMode = 'online' | 'offline';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('offline');
  const [configError, setConfigError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const [localUserId, setLocalUserId] = useState<string|null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<{ percent: number; detail: string; } | null>(null);
  const [model, setModel] = useState('gemini-2.5-flash');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('markdown');
  const [followUpLength, setFollowUpLength] = useState<SummaryLength>('medium');
  const [settings, setSettings] = useState<Settings>({ fontSize: 'base', accentColor: 'blue' });
  const [theme, setTheme] = useState<Theme>('dark');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('source');
  const [fileSummaryMethod, setFileSummaryMethod] = useState<'full' | 'toc'>('full');
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMobile = useIsMobile();
  const isStudio = isAiStudio();
  
  const dataService = useMemo(() => appMode === 'offline' ? storageService : supabaseService, [appMode]);
  const userId = appMode === 'offline' ? localUserId : user?.id;
  
  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
  
  const isFileReady = useMemo(() => {
    if (!currentSession || currentSession.inputType !== 'file') return false;
    return !!currentSession.originalContent;
  }, [currentSession]);


  const modelsToShow = useMemo(() => {
    if (isStudio) {
      return {
        'Google': AVAILABLE_MODELS['Google'],
      };
    }
    return AVAILABLE_MODELS;
  }, [isStudio]);

  useEffect(() => {
      if (isAiStudio() || !isSupabaseEnabled()) {
          setAppMode('offline');
          if (!isAiStudio() && !isSupabaseEnabled()) {
              setConfigError("Cấu hình Supabase bị thiếu. Ứng dụng đang chạy ở chế độ offline. Vui lòng kiểm tra các biến môi trường của bạn.");
          }
      } else {
          setAppMode('online');
      }
  }, []);
  
  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsSummaryLoading(false);
    setIsChatLoading(false);
    setIsRewriting(false);
  }, []);

  const handleCreateNewSessionObject = useCallback(async (): Promise<Session> => {
    if (!userId) throw new Error("User ID not available");
    const newSessionData = createNewSession(userId, outputFormat);
    try {
        const newSession = await dataService.addSession(userId, newSessionData);
        return newSession;
    } catch (err) {
        console.error("Lỗi tạo đối tượng phiên mới:", err);
        throw err;
    }
  }, [outputFormat, userId, dataService]);
  
  const handleCreateNewSession = useCallback(async () => {
    if (!userId) return;
    handleStopGeneration();
    try {
        const newSession = await handleCreateNewSessionObject();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setError(null);
        setFileProgress(null);
        if (isMobile) setMobileView('source');
        setIsSharedView(false);
    } catch (err) {
        setError("Không thể tạo phiên mới.");
    }
  }, [handleStopGeneration, handleCreateNewSessionObject, isMobile, userId]);

  useEffect(() => {
    if (appMode === 'offline') {
      setLocalUserId(storageService.getUserId());
    }
  }, [appMode]);

  useEffect(() => {
    if (authLoading && appMode === 'online') return;
    if (!userId) {
      setIsSessionsLoading(false);
      return;
    };

    let isMounted = true;
    setIsSessionsLoading(true);

    const loadData = async () => {
        try {
            const userSessions = await dataService.getSessions(userId);
            if (!isMounted) return;

            if (userSessions.length > 0) {
                setSessions(userSessions);
                setCurrentSessionId(userSessions[0].id);
            } else {
                const newSessionData = createNewSession(userId);
                const newSession = await dataService.addSession(userId, newSessionData);
                if (!isMounted) return;
                setSessions([newSession]);
                setCurrentSessionId(newSession.id);
            }
        } catch (err) {
            if (isMounted) {
                console.error("Lỗi tải hoặc tạo phiên làm việc:", err);
                setError("Không thể tải các phiên làm việc đã lưu.");
            }
        } finally {
            if (isMounted) {
                setIsSessionsLoading(false);
            }
        }
    };
    
    loadData();

    return () => {
        isMounted = false;
    }
  }, [userId, dataService, appMode, authLoading]);

  useEffect(() => {
    try {
      let savedModel = localStorage.getItem('model');
      const savedTheme = localStorage.getItem('theme') as Theme;
      const savedSettings = localStorage.getItem('settings');
      
      if (isStudio && savedModel && !savedModel.startsWith('gemini')) {
        savedModel = 'gemini-2.5-flash';
        setToastMessage('Đã chuyển sang model Gemini cho môi trường AI Studio.');
      }
      
      if (savedModel) setModel(savedModel);
      else if (isStudio) setModel('gemini-2.5-flash');

      if (savedTheme) setTheme(savedTheme);
      if (savedSettings) setSettings(JSON.parse(savedSettings));

    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, [isStudio]);

  useEffect(() => {
    try {
      localStorage.setItem('model', model);
      localStorage.setItem('theme', theme);
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [model, theme, settings]);
  
  useEffect(() => {
    const handleUrlDecode = async () => {
      try {
        const sharedSessionData = await decodeSessionFromUrl();
        if (sharedSessionData && userId) {
          const newSession: Session = {
            ...(createNewSession(userId, sharedSessionData.outputFormat || 'markdown') as Session),
            ...sharedSessionData,
            id: `shared-${Date.now()}`,
            isShared: true,
          };
          setSessions(prev => [newSession, ...prev.filter(s => s.id !== newSession.id)]);
          setCurrentSessionId(newSession.id);
          setIsSharedView(true);
          setToastMessage("Đã tải phiên được chia sẻ!");
          if (isMobile) setMobileView('result');
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải phiên được chia sẻ.");
      }
    };
    if (userId) {
        handleUrlDecode();
    }
  }, [isMobile, userId]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-contrast');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'contrast') {
      root.classList.add('dark', 'theme-contrast');
    }

    root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';
    root.setAttribute('data-accent-color', settings.accentColor);
  }, [theme, settings]);
  
  const updateCurrentSession = useCallback((updater: (session: Session) => Partial<Session>) => {
    if (!currentSessionId || !userId) return;

    setSessions(prevSessions => {
        const sessionToUpdate = prevSessions.find(s => s.id === currentSessionId);
        if (!sessionToUpdate) {
            console.warn("Không thể tìm thấy phiên làm việc để cập nhật");
            return prevSessions;
        }

        const updates = updater(sessionToUpdate);
        const updatedSession = { ...sessionToUpdate, ...updates };

        if (!sessionToUpdate.isShared) {
            dataService.updateSession(userId, currentSessionId, updates)
                .catch(err => {
                    console.error("Lỗi cập nhật phiên:", err);
                    setToastMessage("Không thể lưu thay đổi.");
                });
        }

        return prevSessions.map(s => (s.id === currentSessionId ? updatedSession : s));
    });
  }, [currentSessionId, userId, setToastMessage, dataService]);

  const handleLoadSession = useCallback(async (id: string) => {
    handleStopGeneration();
    const loadedSession = sessions.find(s => s.id === id);
    if (loadedSession && userId) {
        let fullSession = { ...loadedSession };
        
        // In online mode, originalContentUrl is the session_id in the other table
        const contentIdentifier = appMode === 'online' ? loadedSession.id : loadedSession.originalContentUrl;

        if (contentIdentifier && !loadedSession.originalContent) {
            try {
                const content = await dataService.getFileContent(userId, contentIdentifier);
                fullSession.originalContent = content;
                setSessions(prev => prev.map(s => s.id === id ? fullSession : s));
            } catch (error) {
                console.error("Không thể tải nội dung tệp:", error);
                setError("Không thể tải nội dung tệp gốc cho phiên này.");
            }
        }
        setCurrentSessionId(id);
        setError(null);
        setOutputFormat(fullSession.outputFormat);
        setIsSharedView(!!fullSession.isShared);
    }
}, [sessions, handleStopGeneration, userId, dataService, appMode]);


  const handleDeleteSession = useCallback((id: string) => {
    if (!userId) return;

    dataService.deleteSession(userId, id)
      .then(() => {
        setSessions(prev => {
          const newSessions = prev.filter(s => s.id !== id);
          if (currentSessionId === id) {
            if (newSessions.length > 0) {
              setCurrentSessionId(newSessions[0].id);
            } else {
              handleCreateNewSession();
            }
          }
          return newSessions;
        });
      })
      .catch(err => {
        console.error("Lỗi xóa phiên:", err);
        setError("Không thể xóa phiên.");
      });
  }, [currentSessionId, userId, handleCreateNewSession, dataService]);

  const handleRenameSession = useCallback((id: string, newTitle: string) => {
     if (!userId) return;
    dataService.updateSession(userId, id, { title: newTitle })
      .then(() => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
      })
      .catch(err => {
         console.error("Lỗi đổi tên phiên:", err);
         setToastMessage("Không thể đổi tên phiên.");
      });
  }, [userId, dataService]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!currentSessionId || !userId) return;
    setError(null);
    const progressCallback = (percent: number, detail: string) => setFileProgress({ percent, detail });
    progressCallback(0, 'Đang chuẩn bị...');
    
    const resetState: Partial<Session> = {
        fileName: file.name,
        originalContent: '',
        url: '', transcript: null, youtubeVideoId: null, messages: [], summary: null,
        sources: [], suggestedQuestions: [], originalDocumentToc: null,
    };

    updateCurrentSession(() => resetState);

    try {
        const content = await readFileAsText(file, progressCallback);
        // For Supabase, the upload function handles setting the content in the session_contents table
        await dataService.uploadFileContent(userId, currentSessionId, content);
        updateCurrentSession(() => ({ originalContent: content }));
    } catch (e) {
        console.error("Lỗi đọc hoặc tải lên tệp:", e);
        setError(e instanceof Error ? e.message : "Không thể đọc hoặc lưu tệp.");
    } finally {
        setFileProgress(null);
    }
  }, [currentSessionId, updateCurrentSession, userId, dataService]);

  const handleUrlChange = useCallback((url: string) => {
    updateCurrentSession(() => ({
      url,
      fileName: null, originalContent: null,
      messages: [], summary: null, sources: [], suggestedQuestions: [],
      originalDocumentToc: null,
    }));
  }, [updateCurrentSession]);

  const handleTabChange = useCallback((type: InputType) => {
    updateCurrentSession(() => ({ inputType: type }));
  }, [updateCurrentSession]);

  const handleClearFile = useCallback(async () => {
    if (currentSession?.id && userId) {
        try {
            await dataService.deleteFileContent(userId, currentSession.id);
        } catch(err) {
            console.error("Không thể xóa nội dung tệp cũ:", err)
        }
    }
    updateCurrentSession(() => ({ fileName: null, originalContent: null }));
  }, [updateCurrentSession, currentSession, userId, dataService]);
  
  const processStream = useCallback(async (
    stream: AsyncGenerator<StreamChunk>,
    isChat: boolean,
    isRewrite: boolean
  ) => {
    let fullResponse = '';
    let isProgressPhase = true;
    
    if (isChat) {
      updateCurrentSession(s => ({ messages: [...(s.messages || []), { role: 'model', content: '' }] }));
    } else if (!isRewrite) {
      updateCurrentSession(() => ({ summary: { role: 'model', content: '' }, messages: [] }));
    }

    for await (const chunk of stream) {
      if (chunk.progress) {
          if (isProgressPhase) {
              if (chunk.progress === '[CLEAR]') {
                  updateCurrentSession(() => ({ summary: { role: 'model', content: '' } }));
                  isProgressPhase = false;
              } else {
                  updateCurrentSession(s => ({
                      summary: { role: 'model', content: (s.summary?.content || '') + chunk.progress }
                  }));
              }
          }
      }
      
      if (chunk.text) {
          if (isProgressPhase) {
              isProgressPhase = false;
              fullResponse = chunk.text;
          } else {
              fullResponse += chunk.text;
          }
      
          if (isChat) {
              updateCurrentSession(s => ({
                  messages: (s.messages || []).map((m, i) =>
                      i === (s.messages || []).length - 1 ? { ...m, content: fullResponse } : m
                  ),
              }));
          } else {
              updateCurrentSession(() => ({ summary: { role: 'model', content: fullResponse } }));
          }
      }
      
      if (chunk.groundingChunks?.length) {
          updateCurrentSession(() => ({ sources: chunk.groundingChunks }));
      }
    }
    return fullResponse;
  }, [updateCurrentSession]);

  const generateTitleAndFollowUps = useCallback(async (content: string) => {
    try {
        const [title, questions] = await Promise.all([
            generateTitle(content),
            generateFollowUpQuestions(content)
        ]);
        updateCurrentSession(() => ({ title, suggestedQuestions: questions }));
    } catch (e) {
        console.error("Failed to generate title/follow-ups:", e);
    }
  }, [updateCurrentSession]);


  const handleStartSummarization = useCallback(async (sections?: string[]) => {
    if (!currentSession) return;
    setError(null);
    setIsSummaryLoading(true);
    abortControllerRef.current = new AbortController();

    try {
        let contentToSummarize = '';
        let prompt = promptConfigs[outputFormat][summaryLength];
        
        if (currentSession.inputType === 'file') {
            if (!currentSession.originalContent) throw new Error("Không có nội dung tệp để tóm tắt.");
            if (fileSummaryMethod === 'toc' && !sections) {
                const toc = await generateContent(`${TOC_EXTRACTION_PROMPT}\n\n---\n\n${currentSession.originalContent}`, 'gemini-2.5-flash');
                updateCurrentSession(() => ({ originalDocumentToc: toc || "[TOC_NOT_FOUND]" }));
                return;
            }
            contentToSummarize = currentSession.originalContent;
            if (sections && sections.length > 0 && sections[0] !== 'all') {
                prompt = `Chỉ tóm tắt các phần sau của tài liệu được cung cấp:\n\n- ${sections.join('\n- ')}\n\nHãy tuân thủ các hướng dẫn định dạng sau đây:\n\n${prompt}`;
            }
        } else if (currentSession.inputType === 'web') {
            contentToSummarize = currentSession.url;
            prompt = `Tóm tắt nội dung từ URL sau theo định dạng yêu cầu.\nURL: ${currentSession.url}\n\n---\n\n${prompt}`;
        } else if (currentSession.inputType === 'youtube') {
            const videoId = getYouTubeVideoId(currentSession.url);
            if (!videoId) throw new Error("URL YouTube không hợp lệ.");
            updateCurrentSession(() => ({ youtubeVideoId: videoId }));

            let fullTranscript = '';
            const transcriptStream = streamTranscript(currentSession.url, model, abortControllerRef.current.signal);
            for await (const chunk of transcriptStream) {
                fullTranscript += chunk;
                updateCurrentSession(() => ({ transcript: fullTranscript }));
            }
            contentToSummarize = fullTranscript;
            if (!contentToSummarize) throw new Error("Không thể trích xuất bản ghi.");
        }

        const stream = streamChatResponse({
            model, history: [], newMessage: contentToSummarize, systemPrompt: prompt,
            useWebSearch: currentSession.inputType === 'web', signal: abortControllerRef.current.signal,
            responseMimeType: outputFormat === 'structured' ? 'application/json' : undefined,
        });
        
        const summary = await processStream(stream, false, false);
        await generateTitleAndFollowUps(summary);
        if(isMobile) setMobileView('result');

    } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
        setIsSummaryLoading(false);
    }
  }, [currentSession, model, summaryLength, outputFormat, processStream, generateTitleAndFollowUps, isMobile, fileSummaryMethod, updateCurrentSession]);

  const handleRewrite = useCallback(async (newLength: SummaryLength) => {
    if (!currentSession?.summary?.content) return;
    setError(null);
    setIsRewriting(true);
    handleStopGeneration();
    abortControllerRef.current = new AbortController();

    try {
        const stream = streamChatResponse({
            model, history: [], newMessage: currentSession.summary.content, systemPrompt: promptConfigs[outputFormat][newLength],
            useWebSearch: false, signal: abortControllerRef.current.signal,
        });
        await processStream(stream, false, true);
    } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Không thể viết lại tóm tắt.');
    } finally {
        setIsRewriting(false);
    }
  }, [currentSession, model, outputFormat, processStream, handleStopGeneration]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!currentSession) return;

    const newUserMessage: Message = { role: 'user', content: message };
    const historyForApi = [
        ...(currentSession.summary ? [{ role: 'model' as const, content: `Bối cảnh tóm tắt ban đầu:\n${currentSession.summary.content}` }] : []),
        ...(currentSession.messages || []),
    ];
    
    updateCurrentSession(s => ({ messages: [...(s.messages || []), newUserMessage], suggestedQuestions: [] }));
    
    setError(null);
    setIsChatLoading(true);
    handleStopGeneration();
    abortControllerRef.current = new AbortController();

    try {
        const stream = streamChatResponse({
            model, history: historyForApi, newMessage: message, systemPrompt: CHAT_SYSTEM_PROMPT,
            useWebSearch: currentSession.inputType === 'web', signal: abortControllerRef.current.signal,
        });
        await processStream(stream, true, false);
    } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Không thể gửi tin nhắn.');
    } finally {
        setIsChatLoading(false);
    }
  }, [currentSession, model, processStream, updateCurrentSession, handleStopGeneration]);
  
  const handleClearError = useCallback(() => setError(null), []);

  const handleRetry = useCallback(() => {
    handleClearError();
    if (currentSession) handleStartSummarization();
  }, [currentSession, handleClearError, handleStartSummarization]);
  
  const isLoading = isSummaryLoading || isChatLoading;

  const mainContent = useMemo(() => currentSession ? (
    <WorkspacePanel session={currentSession} isSummaryLoading={isSummaryLoading} isChatLoading={isChatLoading} isRewriting={isRewriting} onRewrite={handleRewrite} onSendMessage={handleSendMessage} followUpLength={followUpLength} setFollowUpLength={setFollowUpLength} onSourceClick={(uri) => console.log("Source clicked:", uri)} updateCurrentSession={updateCurrentSession} onStopGeneration={handleStopGeneration} onSummarizeSections={handleStartSummarization} isSharedView={isSharedView} onRegenerate={handleStartSummarization} />
  ) : null, [currentSession, isSummaryLoading, isChatLoading, isRewriting, handleRewrite, handleSendMessage, followUpLength, setFollowUpLength, updateCurrentSession, handleStopGeneration, handleStartSummarization, isSharedView]);
  
  const mobileContent = useMemo(() => {
    if (!currentSession) return null;
    switch(mobileView) {
      case 'source': return <SourceInputs currentSession={currentSession} onFileSelect={handleFileSelect} onUrlChange={handleUrlChange} onTabChange={handleTabChange} onStartSummarization={handleStartSummarization} onClearFile={handleClearFile} fileProgress={fileProgress} error={error} isLoading={isLoading} model={model} setModel={setModel} summaryLength={summaryLength} setSummaryLength={setSummaryLength} outputFormat={outputFormat} setOutputFormat={setOutputFormat} availableModels={modelsToShow} onSummarizeSections={handleStartSummarization} isMobile={true} theme={theme} setTheme={setTheme} settings={settings} onSettingsChange={setSettings} onOpenPromptEditor={() => setIsPromptEditorOpen(true)} fileSummaryMethod={fileSummaryMethod} setFileSummaryMethod={setFileSummaryMethod} isFileReady={isFileReady} sessions={sessions} loadSession={handleLoadSession} createNewSession={handleCreateNewSession} deleteSession={handleDeleteSession} renameSession={handleRenameSession} setToastMessage={setToastMessage} isStudio={isStudio} onStopGeneration={handleStopGeneration} appMode={appMode} />;
      case 'result': return <MobileResultPanel session={currentSession} isSummaryLoading={isSummaryLoading} isRewriting={isRewriting} onRewrite={handleRewrite} onSourceClick={(uri) => console.log("Source clicked:", uri)} updateCurrentSession={updateCurrentSession} onStopGeneration={handleStopGeneration} onSummarizeSections={handleStartSummarization} isSharedView={isSharedView} onRegenerate={handleStartSummarization} />;
      case 'chat': return <MobileChatPanel session={currentSession} isChatLoading={isChatLoading} onSendMessage={handleSendMessage} followUpLength={followUpLength} setFollowUpLength={setFollowUpLength} onStopGeneration={handleStopGeneration} isSharedView={isSharedView} />;
      default: return null;
    }
  }, [currentSession, mobileView, handleFileSelect, handleUrlChange, handleTabChange, handleStartSummarization, handleClearFile, fileProgress, error, isLoading, model, summaryLength, outputFormat, theme, settings, fileSummaryMethod, isFileReady, sessions, handleLoadSession, handleCreateNewSession, handleDeleteSession, handleRenameSession, isSummaryLoading, isRewriting, handleRewrite, isChatLoading, updateCurrentSession, handleStopGeneration, handleSendMessage, followUpLength, isSharedView, modelsToShow, isStudio, appMode]);

  if (authLoading && appMode === 'online') {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">Đang tải ứng dụng...</p>
            </div>
        </div>
    );
  }

  if (appMode === 'online' && !user) {
    return <Auth />;
  }

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {configError && (
        <div className="flex-shrink-0 bg-red-600 text-white text-center p-2 text-sm font-semibold flex items-center justify-center gap-2">
            <ExclamationCircleIcon className="w-5 h-5" />
            {configError}
        </div>
      )}
      <main className="flex-1 flex overflow-hidden">
        <div className="hidden lg:flex w-full">
            {currentSession && (
                 <aside className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${isPanelCollapsed ? 'w-12' : 'w-[360px]'}`}>
                    <LeftPanel sessions={sessions} currentSession={currentSession} loadSession={handleLoadSession} createNewSession={handleCreateNewSession} deleteSession={handleDeleteSession} renameSession={handleRenameSession} onFileSelect={handleFileSelect} onUrlChange={handleUrlChange} onTabChange={handleTabChange} onStartSummarization={handleStartSummarization} onClearFile={handleClearFile} fileProgress={fileProgress} error={error} isLoading={isLoading} model={model} setModel={setModel} summaryLength={summaryLength} setSummaryLength={setSummaryLength} outputFormat={outputFormat} setOutputFormat={setOutputFormat} availableModels={modelsToShow} theme={theme} setTheme={setTheme} settings={settings} onSettingsChange={setSettings} onSummarizeSections={handleStartSummarization} onOpenPromptEditor={() => setIsPromptEditorOpen(true)} fileSummaryMethod={fileSummaryMethod} setFileSummaryMethod={setFileSummaryMethod} isCollapsed={isPanelCollapsed} onPanelCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)} isFileReady={isFileReady} setToastMessage={setToastMessage} isStudio={isStudio} onStopGeneration={handleStopGeneration} appMode={appMode} />
                </aside>
            )}
            <section className="flex-1 flex flex-col overflow-hidden">
              {error ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                      <ErrorDisplay message={error} onRetry={handleRetry} onStartOver={handleCreateNewSession} />
                  </div>
              ) : mainContent }
            </section>
        </div>
        <div className="lg:hidden w-full h-full flex flex-col">
            <main className="flex-1 p-4 overflow-y-auto">
              {error ? ( <ErrorDisplay message={error} onRetry={handleRetry} onStartOver={handleCreateNewSession} /> ) : mobileContent }
            </main>
            {currentSession && ( <MobileNav activeView={mobileView} setActiveView={setMobileView} resultAvailable={!!currentSession.summary} /> )}
        </div>
      </main>
      
       <PromptEditorModal isOpen={isPromptEditorOpen} onClose={() => setIsPromptEditorOpen(false)} initialPrompt={promptConfigs[outputFormat][summaryLength]} onSave={(newPrompt) => { promptConfigs[outputFormat][summaryLength] = newPrompt; setToastMessage("Đã lưu prompt thành công!"); setIsPromptEditorOpen(false); }} onReset={() => { setToastMessage("Đã đặt lại prompt về mặc định!"); }} />
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default App;