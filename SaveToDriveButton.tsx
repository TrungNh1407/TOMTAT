// FIX: Removed unused 'vite/client' type reference that was causing a "Cannot find type definition file" error.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface SaveToDriveButtonProps {
  fileName: string;
  content: string;
  mimeType: string;
}

// QUAN TRỌNG: ID Khách hàng OAuth 2.0 hiện được lấy từ biến môi trường.
// Bạn phải đặt tiền tố là VITE_ để Vite expose nó cho client.
// FIX: Cast `import.meta` to `any` to prevent a TypeScript error when accessing `env`.
// This is a workaround for environments where Vite's client types are not correctly loaded.
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const SaveToDriveButton: React.FC<SaveToDriveButtonProps> = ({ fileName, content, mimeType }) => {
  type SaveState = 'idle' | 'saving' | 'success' | 'error';

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const tokenClient = useRef<any>(null);
  const isGisInitialized = useRef(false);

  // Nếu ID client không được cấu hình, hoàn toàn không hiển thị nút.
  // Điều này mang lại trải nghiệm người dùng tốt hơn so với việc hiển thị một nút luôn báo lỗi.
  // Nhà phát triển có thể kích hoạt tính năng này bằng cách đặt biến môi trường VITE_GOOGLE_CLIENT_ID.
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    return null;
  }

  const initializeGis = useCallback(() => {
    if (isGisInitialized.current || !(window as any).google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) {
      return;
    }
    
    try {
      tokenClient.current = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_DRIVE_SCOPES,
        callback: '', // Callback is set dynamically before each request
        error_callback: (error: { message: string }) => {
          console.error('Lỗi xác thực Google:', error);
          setErrorMessage(error.message || 'Lỗi xác thực hoặc bị người dùng hủy bỏ.');
          setSaveState('error');
          setTimeout(() => setSaveState('idle'), 3000);
        }
      });
      isGisInitialized.current = true;
    } catch (error) {
        console.error("Không thể khởi tạo Google Token Client:", error);
        setErrorMessage("Không thể khởi tạo API của Google.");
        setSaveState('error');
    }
  }, []);

  useEffect(() => {
    const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (script) {
      (script as HTMLScriptElement).onload = () => initializeGis();
    }
    // If script was already loaded, try to initialize
    if ((window as any).google) {
      initializeGis();
    }
  }, [initializeGis]);

  const uploadFile = (accessToken: string) => {
    const metadata = {
      name: fileName,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(() => {
        setSaveState('success');
        setTimeout(() => setSaveState('idle'), 2500);
    })
    .catch(error => {
        console.error('Lỗi khi tải lên Google Drive:', error);
        setErrorMessage(error?.error?.message || 'Không thể lưu tệp.');
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
    });
  };

  const handleSave = () => {
    setSaveState('saving');
    
    initializeGis();

    if (!tokenClient.current) {
        setErrorMessage('API của Google chưa sẵn sàng. Vui lòng làm mới trang và thử lại.');
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
        return;
    }

    const timeoutId = setTimeout(() => {
        setSaveState(currentState => {
            if (currentState === 'saving') {
                setErrorMessage('Popup xác thực có thể đã bị chặn. Vui lòng kiểm tra cài đặt trình duyệt của bạn.');
                return 'error';
            }
            return currentState;
        });
    }, 10000);

    tokenClient.current.callback = (tokenResponse: any) => {
      clearTimeout(timeoutId);
      if (tokenResponse.error) {
        setErrorMessage(tokenResponse.error_description || 'Yêu cầu quyền đã bị từ chối.');
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      } else if (tokenResponse.access_token) {
        uploadFile(tokenResponse.access_token);
      } else {
        setErrorMessage('Không nhận được mã truy cập hợp lệ từ Google.');
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    };

    tokenClient.current.requestAccessToken();
  };

  const renderButtonContent = () => {
    switch (saveState) {
      case 'saving':
        return (
          <>
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"></div>
            Đang lưu...
          </>
        );
      case 'success':
        return (
          <>
            <CheckIcon className="w-3.5 h-3.5 mr-1" />
            Đã lưu
          </>
        );
      case 'error':
        return (
          <>
            <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
            Lỗi
          </>
        );
      default:
        return (
          <>
            <GoogleDriveIcon className="w-3.5 h-3.5 mr-1" />
            Lưu
          </>
        );
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saveState === 'saving'}
      title={saveState === 'error' ? errorMessage : 'Lưu bản tóm tắt vào Google Drive'}
      className={`flex-1 sm:flex-none flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 w-full
        ${saveState === 'idle' && 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600 focus:ring-slate-500'}
        ${saveState === 'saving' && 'bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed'}
        ${saveState === 'success' && 'bg-green-600 text-white focus:ring-green-500'}
        ${saveState === 'error' && 'bg-red-600 text-white focus:ring-red-500'}
      `}
    >
      {renderButtonContent()}
    </button>
  );
};