import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { SummaryLengthSelector } from './SummaryLengthSelector';
import type { SummaryLength } from './types';
import { Bars3BottomLeftIcon } from './icons/Bars3BottomLeftIcon';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled: boolean;
    summaryLength: SummaryLength;
    onLengthChange: (length: SummaryLength) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, summaryLength, onLengthChange }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isLengthSelectorOpen, setIsLengthSelectorOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

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
            textarea.style.height = '0px';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [message]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current && 
                !popoverRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsLengthSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handleLengthChange = (length: SummaryLength) => {
        onLengthChange(length);
        setIsLengthSelectorOpen(false);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="relative flex-shrink-0">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => setIsLengthSelectorOpen(prev => !prev)}
                        disabled={disabled}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        aria-label="Chọn độ dài tóm tắt"
                    >
                        <Bars3BottomLeftIcon className="w-5 h-5" />
                    </button>
                    {isLengthSelectorOpen && (
                        <div
                            ref={popoverRef}
                            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10"
                        >
                            <SummaryLengthSelector
                                selectedLength={summaryLength}
                                onLengthChange={handleLengthChange}
                                disabled={disabled}
                                layout="horizontal"
                            />
                        </div>
                    )}
                </div>
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