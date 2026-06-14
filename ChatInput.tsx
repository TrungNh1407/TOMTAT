import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { SummaryLengthSelector } from './SummaryLengthSelector';
import type { SummaryLength } from './types';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled: boolean;
    summaryLength: SummaryLength;
    onLengthChange: (length: SummaryLength) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, summaryLength, onLengthChange }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Đặt lại chiều cao về giá trị tối thiểu để buộc tính toán lại chính xác.
            // Điều này rất quan trọng để đảm bảo textarea có thể co lại khi văn bản được xóa đi.
            textarea.style.height = '0px';
            const scrollHeight = textarea.scrollHeight;

            // Đặt chiều cao mới dựa trên chiều cao cuộn của nội dung.
            // Lớp `max-h-36` trong className sẽ giới hạn chiều cao tối đa và cho phép cuộn.
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [message]);

    return (
        <div className="w-full max-w-4xl mx-auto">
             <div className="flex justify-center mb-1">
                <SummaryLengthSelector
                    label="Độ dài câu trả lời"
                    selectedLength={summaryLength}
                    onLengthChange={onLengthChange}
                    disabled={disabled}
                    layout="horizontal"
                />
            </div>
            <form onSubmit={handleSubmit} className="relative flex items-end p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Đặt một câu hỏi tiếp theo..."
                    disabled={disabled}
                    rows={1}
                    className="w-full flex-grow py-1 px-2 bg-transparent focus:outline-none resize-none max-h-36 overflow-y-auto disabled:bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                    type="submit"
                    disabled={disabled || !message.trim()}
                    className="flex-shrink-0 ml-2 p-2 rounded-lg bg-[--color-accent-600] text-white hover:bg-[--color-accent-700] disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
                    aria-label="Gửi tin nhắn"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};
