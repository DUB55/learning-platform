'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ChevronRight, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

type Question = {
    id: string;
    question_text: string;
    options: string[];
    correct_option_index: number;
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
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleSelectOption = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === currentQuestion.correct_option_index;
        if (isCorrect) {
            setScore(s => s + 1);
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#22c55e', '#ffffff']
            });
        }
        setIsAnswered(true);
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setIsFinished(true);
        setIsSaving(true);

        // Final Score calculation (current score is accurate because we updated it on answer)
        // Wait, handleNext is called AFTER score update, so score is current. 
        // NOTE: React state updates are async, but handleNext is triggered by user click, long after setScore. 
        // However, if we finish immediately on last question? No, we show result of last question then click 'Finish'.

        try {
            await (supabase.from('quiz_attempts') as any).insert({
                quiz_id: quiz.id,
                user_id: userId,
                score: Math.round((score / questions.length) * 100), // Store percentage or raw? Schema said Integer. Let's do Percentage.
                max_score: 100
            });
        } catch (err) {
            console.error('Failed to save attempt:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="bg-[#1e293b] rounded-xl border border-white/10 p-8 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                    <Award className="w-10 h-10 text-yellow-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
                <p className="text-slate-400 mb-8">You scored {score} out of {questions.length}</p>

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
                    Score: {score}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
                {currentQuestion.question_text}
            </h3>

            {/* Options */}
            <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correct_option_index;

                    let borderClass = 'border-white/10 hover:border-white/30';
                    let bgClass = 'bg-slate-800/50';
                    let textClass = 'text-slate-200';
                    let Icon = null;

                    if (isAnswered) {
                        if (isCorrect) {
                            borderClass = 'border-green-500';
                            bgClass = 'bg-green-500/10';
                            textClass = 'text-green-400';
                            Icon = Check;
                        } else if (isSelected && !isCorrect) {
                            borderClass = 'border-red-500';
                            bgClass = 'bg-red-500/10';
                            textClass = 'text-red-400';
                            Icon = X;
                        } else {
                            // Dim others
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
                            {!isAnswered && !isSelected && (
                                <div className="w-5 h-5 rounded-full border border-slate-600 group-hover:border-slate-400" />
                            )}
                            {!isAnswered && isSelected && (
                                <div className="w-5 h-5 rounded-full border-4 border-blue-500" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer / Explanation */}
            <div className="min-h-[80px]">
                {isAnswered ? (
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
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                        >
                            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null}
                        className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Check Answer
                    </button>
                )}
            </div>
        </div>
    );
}
