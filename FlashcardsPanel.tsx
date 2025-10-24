import React, { useState } from 'react';
import type { Session, Flashcard } from './types';
import { generateFlashcards } from './aiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { RectangleStackIcon } from './icons/RectangleStackIcon';

interface FlashcardsPanelProps {
  session: Session;
  updateCurrentSession: (updater: (session: Session) => Partial<Session>) => void;
}

const FlashcardsDisplay: React.FC<{ flashcards: Flashcard[] }> = ({ flashcards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % flashcards.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
    };

    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex flex-col items-center p-4 h-full">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Thẻ {currentIndex + 1} / {flashcards.length}
            </div>
            
            {/* 3D Perspective Container */}
            <div 
                className="w-full aspect-[3/2] max-w-sm"
                style={{ perspective: '1000px' }}
            >
                {/* Flippable Card Container */}
                <div
                    className={`relative w-full h-full transition-transform duration-500 cursor-pointer`}
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ 
                        transformStyle: 'preserve-3d', 
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                    }}
                >
                    {/* Front Face (Question) */}
                    <div 
                        className="absolute w-full h-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{currentCard.question}</p>
                    </div>

                    {/* Back Face (Answer) */}
                    <div 
                        className="absolute w-full h-full rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center p-6 text-center"
                        style={{ 
                            backfaceVisibility: 'hidden', 
                            transform: 'rotateY(180deg)' 
                        }}
                    >
                         <p className="text-base text-slate-700 dark:text-slate-300">{currentCard.answer}</p>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="mt-4 text-sm font-semibold text-[--color-accent-600] dark:text-[--color-accent-400] hover:underline"
            >
                {isFlipped ? 'Xem câu hỏi' : 'Xem câu trả lời'}
            </button>
            
            <div className="flex items-center justify-center gap-6 mt-6">
                <button
                    onClick={handlePrev}
                    className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Thẻ trước"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Thẻ tiếp theo"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


export const FlashcardsPanel: React.FC<FlashcardsPanelProps> = ({ session, updateCurrentSession }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!session.summary?.content) {
            setError("Không có nội dung tóm tắt để tạo thẻ ghi nhớ.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedFlashcards = await generateFlashcards(session.summary.content);
            if (generatedFlashcards.length === 0) {
                setError("AI không thể tạo thẻ ghi nhớ từ nội dung này.");
            } else {
                updateCurrentSession(() => ({ flashcards: generatedFlashcards }));
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    };

    if (session.flashcards && session.flashcards.length > 0) {
        return <FlashcardsDisplay flashcards={session.flashcards} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <RectangleStackIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Ôn tập với Thẻ ghi nhớ</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Để AI tự động tạo một bộ thẻ ghi nhớ từ bản tóm tắt để giúp bạn học tập.
            </p>
            {error && (
                 <div className="mt-4 p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                 </div>
            )}
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-6 w-full max-w-xs flex items-center justify-center px-5 py-2.5 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-accent-500]"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                        Đang tạo...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Tạo Thẻ ghi nhớ
                    </>
                )}
            </button>
        </div>
    );
};