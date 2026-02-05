'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ChevronRight, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorLogger from '@/lib/ErrorLogger';

type Question = {
    id: string;
    question_text: string;
    question_type?: 'mcq' | 'open' | 'fill_in_blank';
    options?: string[];
    correct_option_index?: number;
    correct_answer?: string; // for fill_in_blank
    explanation?: string;
};

type Quiz = {
    id: string;
    title: string;
    description?: string;
};

export default function QuizPlayer({ quiz, questions, userId, onExit }: { quiz: Quiz, questions: Question[], userId: string, onExit: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showModelAnswer, setShowModelAnswer] = useState(false);
    const [startTime] = useState(Date.now());

    const saveControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveControllerRef.current) {
                saveControllerRef.current.abort();
            }
        };
    }, []);

    const currentQuestion = questions[currentIndex];
    const qType = currentQuestion.question_type || 'mcq';

    const handleSelectOption = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (qType === 'mcq') {
            if (selectedOption === null) return;
            const correct = selectedOption === currentQuestion.correct_option_index;
            setIsCorrect(correct);
            if (correct) {
                setCorrectCount(c => c + 1);
                triggerConfetti();
            }
            setIsAnswered(true);
        } else if (qType === 'fill_in_blank') {
            if (!inputValue.trim()) return;
            const correct = inputValue.trim().toLowerCase() === currentQuestion.correct_answer?.toLowerCase();
            setIsCorrect(correct);
            if (correct) {
                setCorrectCount(c => c + 1);
                triggerConfetti();
            }
            setIsAnswered(true);
        } else if (qType === 'open') {
            setIsAnswered(true);
        }
    };

    const handleOpenResult = (correct: boolean) => {
        setIsCorrect(correct);
        if (correct) {
            setCorrectCount(c => c + 1);
            triggerConfetti();
        }
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#22c55e', '#ffffff']
        });
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setInputValue('');
            setIsAnswered(false);
            setIsCorrect(null);
            setShowModelAnswer(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setIsFinished(true);
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const scoreVal = Math.round((correctCount / questions.length) * 100);

        // Abort previous save if any
        if (saveControllerRef.current) {
            saveControllerRef.current.abort();
        }
        saveControllerRef.current = new AbortController();
        const signal = saveControllerRef.current.signal;

        try {
            // Save to quiz_attempts (legacy/specific)
            await (supabase.from('quiz_attempts') as any).insert({
                quiz_id: quiz.id,
                user_id: userId,
                score: scoreVal,
                correct_answers: correctCount,
                total_questions: questions.length
            }).abortSignal(signal);

            // Save to study_results (central for Adaptive Logic)
            await (supabase.from('study_results') as any).insert({
                user_id: userId,
                learning_set_id: quiz.id, // Assuming quiz ID as learning set ID here
                score: scoreVal,
                correct_answers: correctCount,
                total_questions: questions.length,
                study_mode: 'quiz',
                time_spent_seconds: timeSpent,
                completed_at: new Date().toISOString()
            }).abortSignal(signal);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Failed to save attempt:', error);
        }
    };

    if (isFinished) {
        const percentage = Math.round((correctCount / questions.length) * 100);
        return (
            <div className="bg-[#1e293b] rounded-xl border border-white/10 p-8 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                    <Award className="w-10 h-10 text-yellow-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
                <p className="text-slate-400 mb-8">You got {correctCount} out of {questions.length} correct</p>

                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
                    {percentage}%
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onExit}
                        className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
                    >
                        Back to Unit
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-6 md:p-8 animate-fade-in max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">{quiz.title}</h2>
                    <span className="text-sm text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
                </div>
                <div className="text-sm font-medium px-3 py-1 bg-slate-800 rounded-lg text-blue-400 border border-blue-500/20">
                    Correct: {correctCount}
                </div>
            </div>

            {/* Progress Bar (Updates on Correct Answers) */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${(correctCount / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
                {currentQuestion.question_text}
            </h3>

            {/* Interaction Area */}
            <div className="mb-8">
                {qType === 'mcq' && (
                    <div className="space-y-3">
                        {currentQuestion.options?.map((option, idx) => {
                            const isSelected = selectedOption === idx;
                            const isCorrectOption = idx === currentQuestion.correct_option_index;

                            let borderClass = 'border-white/10 hover:border-white/30';
                            let bgClass = 'bg-slate-800/50';
                            let textClass = 'text-slate-200';
                            let Icon = null;

                            if (isAnswered) {
                                if (isCorrectOption) {
                                    borderClass = 'border-green-500';
                                    bgClass = 'bg-green-500/10';
                                    textClass = 'text-green-400';
                                    Icon = Check;
                                } else if (isSelected && !isCorrectOption) {
                                    borderClass = 'border-red-500';
                                    bgClass = 'bg-red-500/10';
                                    textClass = 'text-red-400';
                                    Icon = X;
                                } else {
                                    bgClass = 'opacity-50';
                                }
                            } else if (isSelected) {
                                borderClass = 'border-blue-500';
                                bgClass = 'bg-blue-500/10';
                                textClass = 'text-blue-400';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    disabled={isAnswered}
                                    className={`w-full text-left p-4 rounded-xl border ${borderClass} ${bgClass} ${textClass} transition-all flex justify-between items-center group`}
                                >
                                    <span className="font-medium">{option}</span>
                                    {Icon && <Icon className="w-5 h-5" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {qType === 'fill_in_blank' && (
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isAnswered && handleSubmitAnswer()}
                            disabled={isAnswered}
                            placeholder="Type your answer here..."
                            className={`w-full bg-slate-900 border ${isAnswered ? (isCorrect ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5') : 'border-white/10 focus:border-blue-500'} rounded-xl px-6 py-4 text-white text-lg focus:outline-none transition-all`}
                            autoFocus
                        />
                        {isAnswered && !isCorrect && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                Correct answer: <span className="font-bold">{currentQuestion.correct_answer}</span>
                            </div>
                        )}
                        {isAnswered && isCorrect && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold">
                                Well done! That&apos;s correct.
                            </div>
                        )}
                    </div>
                )}

                {qType === 'open' && !isAnswered && (
                    <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-400">
                        Think about your answer, then click &quot;Check Model Answer&quot;
                    </div>
                )}

                {qType === 'open' && isAnswered && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                            <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Model Answer
                            </h4>
                            <p className="text-white text-lg leading-relaxed">
                                {currentQuestion.correct_answer}
                            </p>
                        </div>

                        {isCorrect === null ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-slate-400 text-center text-sm">Was your answer correct?</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleOpenResult(false)}
                                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-bold"
                                    >
                                        <X className="w-5 h-5" />
                                        Incorrect
                                    </button>
                                    <button
                                        onClick={() => handleOpenResult(true)}
                                        className="flex items-center justify-center gap-2 p-4 rounded-xl border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-colors font-bold"
                                    >
                                        <Check className="w-5 h-5" />
                                        Correct
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-xl text-center font-bold ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isCorrect ? 'Marked as Correct' : 'Marked as Incorrect'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="min-h-[80px]">
                {(isAnswered && (qType !== 'open' || isCorrect !== null)) ? (
                    <div className="animate-fade-in-up">
                        {currentQuestion.explanation && (
                            <div className="mb-6 p-4 bg-slate-800 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm text-slate-300">
                                    <span className="font-bold text-white block mb-1">Explanation:</span>
                                    {currentQuestion.explanation}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={handleNext}
                            className={`w-full ${isCorrect ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.99]`}
                        >
                            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : !isAnswered && (
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={(qType === 'mcq' && selectedOption === null) || (qType === 'fill_in_blank' && !inputValue.trim())}
                        className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {qType === 'open' ? 'Check Model Answer' : 'Check Answer'}
                    </button>
                )}
            </div>
        </div>
    );
}
