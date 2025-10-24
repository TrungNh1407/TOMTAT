import React, { useState } from 'react';
import type { Session, QuizQuestion } from './types';
import { generateQuiz } from './aiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';

interface QuizPanelProps {
  session: Session;
  updateCurrentSession: (updater: (session: Session) => Partial<Session>) => void;
}

const QuizDisplay: React.FC<{ quiz: QuizQuestion[]; onRetake: () => void }> = ({ quiz, onRetake }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = quiz[currentIndex];

    const handleSubmit = () => {
        if (!selectedOption) return;
        setIsSubmitted(true);
        if (selectedOption === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        setIsSubmitted(false);
        setSelectedOption(null);
        if (currentIndex < quiz.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };
    
    const handleRestart = () => {
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsSubmitted(false);
        setScore(0);
        setIsFinished(false);
        onRetake();
    }

    if (isFinished) {
        const percentage = Math.round((score / quiz.length) * 100);
        return (
            <div className="flex flex-col items-center justify-center p-6 h-full text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hoàn thành!</h3>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
                    Điểm của bạn: <span className="font-bold text-[--color-accent-600]">{score} / {quiz.length}</span> ({percentage}%)
                </p>
                <button
                    onClick={handleRestart}
                    className="mt-8 flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Làm lại bài kiểm tra
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-4 space-y-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Câu hỏi {currentIndex + 1} / {quiz.length}
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{currentQuestion.question}</p>
            
            <div className="space-y-3">
                {currentQuestion.options.map(option => {
                    const isCorrect = option === currentQuestion.correctAnswer;
                    const isSelected = option === selectedOption;
                    let stateClasses = 'border-slate-300 dark:border-slate-600 hover:border-[--color-accent-500] hover:bg-[--color-accent-500]/10';

                    if (isSubmitted) {
                        if (isCorrect) {
                            stateClasses = 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
                        } else if (isSelected) {
                            stateClasses = 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
                        }
                    }

                    return (
                        <label key={option} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${stateClasses}`}>
                            <input
                                type="radio"
                                name={`question-${currentIndex}`}
                                value={option}
                                checked={isSelected}
                                onChange={() => setSelectedOption(option)}
                                disabled={isSubmitted}
                                className="h-4 w-4 text-[--color-accent-600] focus:ring-[--color-accent-500] disabled:opacity-50"
                            />
                            <span className="ml-3 text-sm">{option}</span>
                            {isSubmitted && isCorrect && <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />}
                            {isSubmitted && isSelected && !isCorrect && <XCircleIcon className="w-5 h-5 text-red-500 ml-auto" />}
                        </label>
                    );
                })}
            </div>
            
            <div className="pt-2">
                <button
                    onClick={isSubmitted ? handleNext : handleSubmit}
                    disabled={!selectedOption}
                    className="w-full px-5 py-2 bg-[--color-accent-600] text-white font-semibold rounded-md shadow-sm hover:bg-[--color-accent-700] disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitted ? (currentIndex === quiz.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo') : 'Kiểm tra'}
                </button>
            </div>
        </div>
    );
};

export const QuizPanel: React.FC<QuizPanelProps> = ({ session, updateCurrentSession }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!session.summary?.content) {
            setError("Không có nội dung tóm tắt để tạo bài kiểm tra.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedQuiz = await generateQuiz(session.summary.content);
             if (generatedQuiz.length === 0) {
                setError("AI không thể tạo bài kiểm tra từ nội dung này.");
            } else {
                updateCurrentSession(() => ({ quiz: generatedQuiz }));
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi không xác định.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRetake = () => {
        // This is a simple re-render trigger. More complex logic could go here if needed.
    };

    if (session.quiz && session.quiz.length > 0) {
        return <QuizDisplay quiz={session.quiz} onRetake={handleRetake} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Kiểm tra kiến thức</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Tạo một bài kiểm tra trắc nghiệm nhanh để xem bạn đã ghi nhớ được bao nhiêu.
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
                        Tạo Bài kiểm tra
                    </>
                )}
            </button>
        </div>
    );
};