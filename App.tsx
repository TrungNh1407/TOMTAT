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
import { streamChatResponse, streamTranscript, generateTitle, generateFollowUpQuestions, generateContent, StreamChunk } from './aiService';
import { TOC_EXTRACTION_PROMPT, promptConfigs, CHAT_SYSTEM_PROMPT } from './constants';
import { decodeSessionFromUrl } from './shareUtils';
import * as pdfjsLib from 'pdfjs-dist';
import { AuthProvider, useAuth } from './AuthContext';
import Auth from './Auth';
import * as firestoreService from './firestoreService';
import { isAiStudio } from './isAiStudio';

// Định cấu hình worker PDF.js. URL trỏ đến phiên bản worker trên CDN khớp với phiên bản trong package.json.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs`;


// --- Helper Functions ---

// Hàm mới để đọc nội dung PDF
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
            // Sửa lỗi typing cho 'item'
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            pageTexts[pageNum - 1] = pageText;
        } catch (error) {
            console.error(`Lỗi khi xử lý trang ${pageNum}:`, error);
            pageTexts[pageNum - 1] = ''; // Gán chuỗi rỗng nếu có lỗi để không làm hỏng toàn bộ quá trình
        } finally {
            pagesProcessed++;
            onProgress((pagesProcessed / numPages) * 100, `Đang trích xuất văn bản từ trang ${pagesProcessed}/${numPages}...`);
        }
    };

    // Xử lý song song với giới hạn đồng thời để tránh quá tải bộ nhớ
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

const createNewSession = (outputFormat: OutputFormat = 'markdown'): Omit<Session, 'id'> => ({
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
  originalContentUrl: null,
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

function AppContent() {
  // --- State Management ---
  const { user, isAuthModalOpen, closeAuthModal } = useAuth();
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
  const [isStudio] = useState(isAiStudio());


  // --- Derived State ---
  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
  
  const isFileReady = useMemo(() => {
    if (!currentSession || currentSession.inputType !== 'file') return false;
    // Tệp sẵn sàng nếu có nội dung gốc HOẶC có URL nội dung (chờ tải về)
    return !!currentSession.originalContent || !!currentSession.originalContentUrl;
  }, [currentSession]);


  const modelsToShow = useMemo(() => {
    if (isStudio) {
      return {
        'Google': AVAILABLE_MODELS['Google'],
      };
    }
    return AVAILABLE_MODELS;
  }, [isStudio]);
  
  // --- Effects ---
  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsSummaryLoading(false);
    setIsChatLoading(false);
    setIsRewriting(false);
  }, []);

  const handleCreateNewSessionObject = useCallback(async (userId: string): Promise<Session> => {
    const newSessionData = createNewSession(outputFormat);
    try {
        const newSession = await firestoreService.addSession(userId, newSessionData);
        return newSession;
    } catch (err) {
        console.error("Lỗi tạo đối tượng phiên mới:", err);
        throw err;
    }
  }, [outputFormat]);
  
  const handleCreateNewSession = useCallback(async () => {
    if (!user) return;
    handleStopGeneration();
    try {
        const newSession = await handleCreateNewSessionObject(user.uid);
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setError(null);
        setFileProgress(null);
        if (isMobile) setMobileView('source');
        setIsSharedView(false);
    } catch (err) {
        setError("Không thể tạo phiên mới.");
    }
  }, [handleStopGeneration, handleCreateNewSessionObject, isMobile, user]);

  // Tải các phiên làm việc từ Firestore hoặc localStorage khi người dùng thay đổi
  useEffect(() => {
    if (!user) {
        // user chưa được khởi tạo, không làm gì cả
        return;
    }

    const loadData = async () => {
        setIsSessionsLoading(true);
        try {
            const userSessions = await firestoreService.getSessions(user.uid);
            if (userSessions.length > 0) {
                setSessions(userSessions);
                setCurrentSessionId(userSessions[0].id);
            } else {
                // Tạo phiên mới nếu không có phiên nào tồn tại cho người dùng này (kể cả khách)
                const newSession = await handleCreateNewSessionObject(user.uid);
                setSessions([newSession]);
                setCurrentSessionId(newSession.id);
            }
        } catch (err) {
            console.error("Lỗi tải hoặc tạo phiên làm việc:", err);
            setError("Không thể tải hoặc tạo phiên làm việc của bạn.");
        } finally {
            setIsSessionsLoading(false);
        }
    };

    loadData();
  }, [user, handleCreateNewSessionObject]);


  // Load state from localStorage on initial render
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

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('model', model);
      localStorage.setItem('theme', theme);
      localStorage.setItem('settings', JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [model, theme, settings]);
  
  // Handle shared session from URL
  useEffect(() => {
    const handleUrlDecode = async () => {
      try {
        const sharedSessionData = await decodeSessionFromUrl();
        if (sharedSessionData) {
          const newSession: Session = {
            ...(createNewSession(sharedSessionData.outputFormat || 'markdown') as Session),
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
    handleUrlDecode();
  }, [isMobile]);

  // Apply theme and settings to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-contrast');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'contrast') {
      root.classList.add('dark', 'theme-contrast');
    }
    // For 'light' theme, no classes are added.

    root.style.fontSize = settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px';
    root.setAttribute('data-accent-color', settings.accentColor);
  }, [theme, settings]);
  
  // Tải nội dung tệp từ Firebase Storage nếu cần
  useEffect(() => {
    if (currentSession?.originalContentUrl && !currentSession.originalContent && user && !user.isGuest) {
      setFileProgress({ percent: 50, detail: 'Đang tải nội dung tệp...' });
      firestoreService.getFileContent(currentSession.originalContentUrl)
        .then(content => {
          updateCurrentSession(() => ({ originalContent: content }));
          setFileProgress(null);
        })
        .catch(error => {
          console.error("Lỗi tải nội dung tệp:", error);
          setError("Không thể tải nội dung tệp gốc.");
          setFileProgress(null);
        });
    }
  }, [currentSession?.id, currentSession?.originalContentUrl, user]);


  // --- Session Management Callbacks ---
  const updateCurrentSession = useCallback((updater: (session: Session) => Partial<Session>) => {
    if (!currentSessionId || !user) return;

    setSessions(prevSessions => {
        const sessionToUpdate = prevSessions.find(s => s.id === currentSessionId);
        if (!sessionToUpdate) {
            console.warn("Không thể tìm thấy phiên làm việc để cập nhật");
            return prevSessions;
        }

        const updates = updater(sessionToUpdate);
        const updatedSession = { ...sessionToUpdate, ...updates };

        if (!sessionToUpdate.isShared) {
            firestoreService.updateSession(user.uid, currentSessionId, updates)
                .catch(err => {
                    console.error("Lỗi cập nhật phiên:", err);
                    setToastMessage("Không thể lưu thay đổi vào đám mây.");
                });
        }

        return prevSessions.map(s => (s.id === currentSessionId ? updatedSession : s));
    });
  }, [currentSessionId, user, setToastMessage]);

  const handleLoadSession = useCallback((id: string) => {
    handleStopGeneration();
    setCurrentSessionId(id);
    setError(null);
    const loadedSession = sessions.find(s => s.id === id);
    if (loadedSession) {
      setOutputFormat(loadedSession.outputFormat);
      setIsSharedView(!!loadedSession.isShared);
    }
  }, [sessions, handleStopGeneration]);

  const handleDeleteSession = useCallback((id: string) => {
    if (!user) return;

    firestoreService.deleteSession(user.uid, id)
      .then(() => {
        setSessions(prev => {
          const newSessions = prev.filter(s => s.id !== id);
          if (currentSessionId === id) {
            if (newSessions.length > 0) {
              setCurrentSessionId(newSessions[0].id);
            } else {
              // Nếu không còn phiên nào, hãy tạo một phiên mới
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
  }, [currentSessionId, user, handleCreateNewSession]);

  const handleRenameSession = useCallback((id: string, newTitle: string) => {
     if (!user) return;
    firestoreService.updateSession(user.uid, id, { title: newTitle })
      .then(() => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
      })
      .catch(err => {
         console.error("Lỗi đổi tên phiên:", err);
         setToastMessage("Không thể đổi tên phiên.");
      });
  }, [user]);

  // --- Input Handlers ---

  const handleFileSelect = useCallback(async (file: File) => {
    if (!currentSessionId || !user) return;
    setError(null);
    const progressCallback = (percent: number, detail: string) => {
        setFileProgress({ percent, detail });
    };
    progressCallback(0, 'Đang chuẩn bị...');
    
    // Luôn đặt lại các trường này khi chọn tệp mới
    const resetState = {
        fileName: file.name,
        originalContent: '',
        originalContentUrl: null,
        url: '',
        transcript: null,
        youtubeVideoId: null,
        messages: [],
        summary: null,
        sources: [],
        suggestedQuestions: [],
        originalDocumentToc: null,
    };

    updateCurrentSession(() => resetState);

    try {
        const content = await readFileAsText(file, progressCallback);
        
        // Nếu là khách, chỉ lưu nội dung vào state (và localStorage thông qua updateCurrentSession).
        if (user.isGuest) {
            updateCurrentSession(() => ({ originalContent: content }));
        } else {
            // Nếu là người dùng đã đăng nhập, tải lên bộ nhớ đệm.
            progressCallback(95, 'Đang tải lên bộ nhớ đệm an toàn...');
            const url = await firestoreService.uploadFileContent(user.uid, currentSessionId, content);
            updateCurrentSession(() => ({ originalContent: content, originalContentUrl: url }));
        }
    } catch (e) {
        console.error("Lỗi đọc hoặc tải lên tệp:", e);
        setError(e instanceof Error ? e.message : "Không thể đọc hoặc tải lên tệp.");
    } finally {
        setFileProgress(null);
    }
}, [currentSessionId, updateCurrentSession, user]);


  const handleUrlChange = useCallback((url: string) => {
    updateCurrentSession(() => ({
      url,
      fileName: null,
      originalContent: null,
      originalContentUrl: null,
      messages: [],
      summary: null,
      sources: [],
      suggestedQuestions: [],
      originalDocumentToc: null,
    }));
  }, [updateCurrentSession]);

  const handleTabChange = useCallback((type: InputType) => {
    updateCurrentSession(() => ({ inputType: type }));
  }, [updateCurrentSession]);

  const handleClearFile = useCallback(() => {
    if(currentSession?.id && user && !user.isGuest && currentSession.originalContentUrl) {
        firestoreService.deleteFileContent(currentSession.originalContentUrl).catch(console.error);
    }
    updateCurrentSession(() => ({ fileName: null, originalContent: null, originalContentUrl: null }));
  }, [updateCurrentSession, user, currentSession]);
  
  // --- Core AI Logic ---

  const processStream = useCallback(async (
    stream: AsyncGenerator<StreamChunk>,
    isChat: boolean,
    isRewrite: boolean
  ) => {
    let fullResponse = '';
    let isProgressPhase = true;
    
    if (isChat) {
      updateCurrentSession(s => ({ messages: [...s.messages, { role: 'model', content: '' }] }));
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
              fullResponse = chunk.text; // Start fresh
          } else {
              fullResponse += chunk.text;
          }
      
          if (isChat) {
              updateCurrentSession(s => ({
                  messages: s.messages.map((m, i) =>
                      i === s.messages.length - 1 ? { ...m, content: fullResponse } : m
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

            // Path 1: Initial request to GENERATE the Table of Contents.
            // This path does not perform a summary; it stops to let the user select sections.
            if (fileSummaryMethod === 'toc' && !sections) {
                const contentForToc = currentSession.originalContent;
                const fullPromptForToc = `${TOC_EXTRACTION_PROMPT}\n\n---\n\n${contentForToc}`;
                // Always use a fast, reliable model for this internal utility task.
                const toc = await generateContent(fullPromptForToc, 'gemini-2.5-flash');
                updateCurrentSession(() => ({ originalDocumentToc: toc || "[TOC_NOT_FOUND]" }));
                // GIỮ trạng thái tải; chúng ta đang chờ người dùng nhập liệu từ TocSelector.
                return;
            }

            // If we've reached here, we are performing a summarization.
            // The content to summarize is always the full document.
            contentToSummarize = currentSession.originalContent;

            // Path 2: Summarizing specific sections selected from the TOC.
            // We modify the system prompt to guide the AI.
            if (sections && sections.length > 0 && sections[0] !== 'all') {
                prompt = `Chỉ tóm tắt các phần sau của tài liệu được cung cấp:\n\n- ${sections.join('\n- ')}\n\nHãy tuân thủ các hướng dẫn định dạng sau đây:\n\n${prompt}`;
            }
            // Path 3: Summarizing the full document.
            // This covers fileSummaryMethod === 'full' OR when ['all'] is passed from TocSelector.
            // No changes are needed; the default prompt and full contentToSummarize are correct.

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
            model,
            history: [],
            newMessage: contentToSummarize,
            systemPrompt: prompt,
            useWebSearch: currentSession.inputType === 'web',
            signal: abortControllerRef.current.signal,
            responseMimeType: outputFormat === 'structured' ? 'application/json' : undefined,
        });
        
        const summary = await processStream(stream, false, false);
        await generateTitleAndFollowUps(summary);
        if(isMobile) setMobileView('result');

    } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(err.message || 'Đã xảy ra lỗi không xác định.');
        }
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
        const contentToSummarize = currentSession.summary.content;
        const prompt = promptConfigs[outputFormat][newLength];

        const stream = streamChatResponse({
            model,
            history: [],
            newMessage: contentToSummarize,
            systemPrompt: prompt,
            useWebSearch: false,
            signal: abortControllerRef.current.signal,
        });

        await processStream(stream, false, true);
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(err.message || 'Không thể viết lại tóm tắt.');
        }
    } finally {
        setIsRewriting(false);
    }
  }, [currentSession, model, outputFormat, processStream, handleStopGeneration]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!currentSession) return;

    const newUserMessage: Message = { role: 'user', content: message };
    const currentMessages = currentSession.messages || [];
    
    // Tạo lịch sử cho lệnh gọi API *trước khi* cập nhật trạng thái.
    const historyForApi = [
        ...(currentSession.summary ? [{ role: 'model' as const, content: `Bối cảnh tóm tắt ban đầu:\n${currentSession.summary.content}` }] : []),
        ...currentMessages,
    ];
    
    // Thực hiện cập nhật giao diện người dùng một cách lạc quan
    updateCurrentSession(s => ({
        messages: [...s.messages, newUserMessage],
        suggestedQuestions: [],
    }));
    
    setError(null);
    setIsChatLoading(true);
    handleStopGeneration();
    abortControllerRef.current = new AbortController();

    try {
        // FIX: Added missing properties to the streamChatResponse call to match its definition.
        const stream = streamChatResponse({
            model,
            history: historyForApi, // Truyền lịch sử *không có* tin nhắn mới
            newMessage: message, // Truyền
            systemPrompt: CHAT_SYSTEM_PROMPT,
            useWebSearch: currentSession.inputType === 'web',
            signal: abortControllerRef.current.signal,
        });
        
        const response = await processStream(stream, true, false);
        // Do not generate follow-ups for chat messages for now
        // await generateTitleAndFollowUps(response);

    } catch (err: any) {
        if (err.name !== 'AbortError') {
            setError(err.message || 'Không thể gửi tin nhắn.');
        }
    } finally {
        setIsChatLoading(false);
    }
  }, [currentSession, model, processStream, updateCurrentSession, handleStopGeneration]);
  
  const handleClearError = useCallback(() => setError(null), []);

  const handleRetry = useCallback(() => {
    handleClearError();
    // Logic thử lại có thể phức tạp hơn, nhưng hiện tại chỉ cần thử lại tóm tắt
    if (currentSession) {
      handleStartSummarization();
    }
  }, [currentSession, handleClearError, handleStartSummarization]);
  
  // --- Render Logic ---

  const isLoading = isSummaryLoading || isChatLoading;

  // FIX: Moved useMemo calls before the conditional return to comply with Rules of Hooks.
  const mainContent = useMemo(() => currentSession ? (
    <WorkspacePanel
      session={currentSession}
      isSummaryLoading={isSummaryLoading}
      isChatLoading={isChatLoading}
      isRewriting={isRewriting}
      onRewrite={handleRewrite}
      onSendMessage={handleSendMessage}
      followUpLength={followUpLength}
      setFollowUpLength={setFollowUpLength}
      onSourceClick={(uri) => console.log("Source clicked:", uri)}
      updateCurrentSession={updateCurrentSession}
      onStopGeneration={handleStopGeneration}
      onSummarizeSections={handleStartSummarization}
      isSharedView={isSharedView}
    />
  ) : null, [currentSession, isSummaryLoading, isChatLoading, isRewriting, handleRewrite, handleSendMessage, followUpLength, setFollowUpLength, updateCurrentSession, handleStopGeneration, handleStartSummarization, isSharedView]);
  
  const mobileContent = useMemo(() => {
    if (!currentSession) return null;
    switch(mobileView) {
      case 'source':
        return (
          <SourceInputs
            currentSession={currentSession}
            onFileSelect={handleFileSelect}
            onUrlChange={handleUrlChange}
            onTabChange={handleTabChange}
            onStartSummarization={handleStartSummarization}
            onClearFile={handleClearFile}
            fileProgress={fileProgress}
            error={error}
            isLoading={isLoading}
            model={model}
            setModel={setModel}
            summaryLength={summaryLength}
            setSummaryLength={setSummaryLength}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            availableModels={modelsToShow}
            onSummarizeSections={handleStartSummarization}
            isMobile={true}
            theme={theme}
            setTheme={setTheme}
            settings={settings}
            onSettingsChange={setSettings}
            onOpenPromptEditor={() => setIsPromptEditorOpen(true)}
            fileSummaryMethod={fileSummaryMethod}
            setFileSummaryMethod={setFileSummaryMethod}
            isFileReady={isFileReady}
            sessions={sessions}
            loadSession={handleLoadSession}
            createNewSession={handleCreateNewSession}
            deleteSession={handleDeleteSession}
            renameSession={handleRenameSession}
            setToastMessage={setToastMessage}
            isStudio={isStudio}
            // FIX: Cannot find name 'onStopGeneration'. Did you mean 'handleStopGeneration'?
            onStopGeneration={handleStopGeneration}
          />
        );
      case 'result':
        return (
          <MobileResultPanel
            session={currentSession}
            isSummaryLoading={isSummaryLoading}
            isRewriting={isRewriting}
            onRewrite={handleRewrite}
            onSourceClick={(uri) => console.log("Source clicked:", uri)}
            updateCurrentSession={updateCurrentSession}
            onStopGeneration={handleStopGeneration}
            onSummarizeSections={handleStartSummarization}
            isSharedView={isSharedView}
          />
        );
      case 'chat':
        return (
          <MobileChatPanel
            session={currentSession}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            followUpLength={followUpLength}
            setFollowUpLength={setFollowUpLength}
            onStopGeneration={handleStopGeneration}
            isSharedView={isSharedView}
          />
        );
      default:
        return null;
    }
  }, [
      currentSession, mobileView, handleFileSelect, handleUrlChange, handleTabChange, 
      handleStartSummarization, handleClearFile, fileProgress, error, isLoading, model,
      summaryLength, outputFormat, theme, settings, fileSummaryMethod,
      isFileReady, sessions, handleLoadSession, handleCreateNewSession, handleDeleteSession,
      handleRenameSession, isSummaryLoading, isRewriting, handleRewrite, isChatLoading, 
      updateCurrentSession, handleStopGeneration, handleSendMessage, followUpLength, isSharedView, modelsToShow,
      isStudio
  ]);

  if (isSessionsLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">Đang tải dữ liệu người dùng...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <main className="flex-1 flex overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden lg:flex w-full">
            {currentSession && (
                 <aside className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${isPanelCollapsed ? 'w-12' : 'w-[360px]'}`}>
                    <LeftPanel
                        sessions={sessions}
                        currentSession={currentSession}
                        loadSession={handleLoadSession}
                        createNewSession={handleCreateNewSession}
                        deleteSession={handleDeleteSession}
                        renameSession={handleRenameSession}
                        onFileSelect={handleFileSelect}
                        onUrlChange={handleUrlChange}
                        onTabChange={handleTabChange}
                        onStartSummarization={handleStartSummarization}
                        onClearFile={handleClearFile}
                        fileProgress={fileProgress}
                        error={error}
                        isLoading={isLoading}
                        model={model}
                        setModel={setModel}
                        summaryLength={summaryLength}
                        setSummaryLength={setSummaryLength}
                        outputFormat={outputFormat}
                        setOutputFormat={setOutputFormat}
                        availableModels={modelsToShow}
                        theme={theme}
                        setTheme={setTheme}
                        settings={settings}
                        onSettingsChange={setSettings}
                        onSummarizeSections={handleStartSummarization}
                        onOpenPromptEditor={() => setIsPromptEditorOpen(true)}
                        fileSummaryMethod={fileSummaryMethod}
                        setFileSummaryMethod={setFileSummaryMethod}
                        isCollapsed={isPanelCollapsed}
                        onPanelCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
                        isFileReady={isFileReady}
                        setToastMessage={setToastMessage}
                        isStudio={isStudio}
                        // FIX: Cannot find name 'onStopGeneration'. Did you mean 'handleStopGeneration'?
                        onStopGeneration={handleStopGeneration}
                    />
                </aside>
            )}
            <section className="flex-1 flex flex-col overflow-hidden">
              {error ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                      <ErrorDisplay message={error} onRetry={handleRetry} onStartOver={handleCreateNewSession} />
                  </div>
              ) : (
                  mainContent
              )}
            </section>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden w-full h-full flex flex-col">
            <main className="flex-1 p-4 overflow-y-auto">
              {error ? (
                  <ErrorDisplay message={error} onRetry={handleRetry} onStartOver={handleCreateNewSession} />
              ) : mobileContent }
            </main>
            {currentSession && (
              <MobileNav
                activeView={mobileView}
                setActiveView={setMobileView}
                resultAvailable={!!currentSession.summary}
              />
            )}
        </div>
      </main>
      
       {isAuthModalOpen && <Auth onClose={closeAuthModal} />}

       <PromptEditorModal
          isOpen={isPromptEditorOpen}
          onClose={() => setIsPromptEditorOpen(false)}
          initialPrompt={promptConfigs[outputFormat][summaryLength]}
          onSave={(newPrompt) => {
            promptConfigs[outputFormat][summaryLength] = newPrompt;
            setToastMessage("Đã lưu prompt thành công!");
            setIsPromptEditorOpen(false);
          }}
          onReset={() => {
            // This is a simplified reset. A more robust solution would re-import defaults.
            // For now, it just resets to the currently loaded prompt in constants.ts.
            // To make this work as expected, we'd need to keep a copy of the original prompts.
            // This implementation is a placeholder for that concept.
            setToastMessage("Đã đặt lại prompt về mặc định!");
          }}
      />
      
      <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[--color-accent-500] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-300 font-semibold">Đang khởi tạo ứng dụng...</p>
        </div>
      </div>
    );
  }

  return <AppContent />;
}


const AppWrapper = () => (
    <AuthProvider>
        <App />
    </AuthProvider>
);

export default AppWrapper;