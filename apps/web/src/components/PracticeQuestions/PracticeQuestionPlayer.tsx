'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, ChevronRight, AlertCircle, GripVertical, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import ErrorLogger from '@/lib/ErrorLogger';

type DragDropPair = { left: string; right: string };

export type PracticeQuestion =
    | {
        id: string;
        question_text: string;
        question_type: 'mcq';
        options: string[];
        correct_answer: string;
        explanation?: string;
    }
    | {
        id: string;
        question_text: string;
        question_type: 'input';
        correct_answer: string;
        explanation?: string;
    }
    | {
        id: string;
        question_text: string;
        question_type: 'drag_drop';
        options: DragDropPair[];
        explanation?: string;
    };

export default function PracticeQuestionPlayer({
    questions,
    onExit,
    userId,
    learningSetId,
    mode = 'practice'
}: {
    questions: PracticeQuestion[],
    onExit: () => void,
    userId?: string,
    learningSetId?: string,
    mode?: string
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [startTime] = useState(Date.now());
    const [isSaving, setIsSaving] = useState(false);

    // MCQ State
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Input State
    const [inputValue, setInputValue] = useState('');

    // Drag Drop State
    const [pairs, setPairs] = useState<{ left: string, right: string | null }[]>([]);
    const [availableRight, setAvailableRight] = useState<string[]>([]);
    const [draggedItem, setDraggedItem] = useState<{ index: number, type: 'left' | 'right' } | null>(null);

    const currentQuestion = questions[currentIndex];

    // Initialize Drag Drop
    useEffect(() => {
        if (currentQuestion?.question_type === 'drag_drop') {
            const leftItems = currentQuestion.options.map(o => o.left);
            const rightItems = currentQuestion.options.map(o => o.right).sort(() => Math.random() - 0.5);
            setPairs(leftItems.map((l: string) => ({ left: l, right: null })));
            setAvailableRight(rightItems);
        }
    }, [currentIndex, currentQuestion]);

    const handleCheck = () => {
        let correct = false;
        if (currentQuestion.question_type === 'mcq') {
            correct = selectedOption === parseInt(currentQuestion.correct_answer || '0');
        } else if (currentQuestion.question_type === 'input') {
            // Self-check for complexity or auto-check? 
            // User requested: "with input questions I want that the user is able to click on a button on the website so it can check its own question it tells the website whether the answer of the user was correct or incorrect"
            setIsAnswered(true);
            return;
        } else if (currentQuestion.question_type === 'drag_drop') {
            correct = pairs.every(p => {
                const original = currentQuestion.options.find(o => o.left === p.left);
                return original && original.right === p.right;
            });
        }

        setIsCorrect(correct);
        if (correct) {
            setCorrectCount(c => c + 1);
            triggerConfetti();
        }
        setIsAnswered(true);
    };

    const handleSelfCheck = (correct: boolean) => {
        setIsCorrect(correct);
        if (correct) {
            setCorrectCount(c => c + 1);
        }
        setIsAnswered(true);
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#3b82f6', '#ffffff']
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(i => i + 1);
            setIsAnswered(false);
            setIsCorrect(null);
            setSelectedOption(null);
            setInputValue('');
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        setIsFinished(true);
        if (userId && learningSetId) {
            setIsSaving(true);
            try {
                const timeSpent = Math.round((Date.now() - startTime) / 1000);
                const { error } = await supabase.from('study_results').insert({
                    user_id: userId,
                    learning_set_id: learningSetId,
                    score: Math.round((correctCount / questions.length) * 100),
                    correct_answers: correctCount,
                    total_questions: questions.length,
                    study_mode: mode,
                    time_spent_seconds: timeSpent,
                    completed_at: new Date().toISOString()
                });
                if (error) throw error;
            } catch (err) {
                ErrorLogger.error('Error saving study results:', err);
            } finally {
                setIsSaving(false);
            }
        }
    };

    // Drag Drop Handlers
    const onDragStart = (index: number, type: 'left' | 'right') => {
        setDraggedItem({ index, type });
    };

    const onDrop = (targetIndex: number) => {
        if (!draggedItem || draggedItem.type !== 'right') return;

        const itemToMove = availableRight[draggedItem.index];
        const newPairs = [...pairs];
        const existingVal = newPairs[targetIndex].right;

        newPairs[targetIndex].right = itemToMove;

        const newAvailable = [...availableRight];
        newAvailable.splice(draggedItem.index, 1);
        if (existingVal) newAvailable.push(existingVal);

        setPairs(newPairs);
        setAvailableRight(newAvailable);
        setDraggedItem(null);
    };

    if (isFinished) {
        return (
            <div className="bg-[#1e293b] rounded-2xl border border-white/10 p-12 text-center animate-fade-in flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Practice Done!</h2>
                <p className="text-slate-400 mb-8">You have completed all questions in this section.</p>
                <button
                    onClick={onExit}
                    disabled={isSaving}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'Saving Results...' : 'Finish Practice'}
                </button>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-white/10 overflow-hidden animate-fade-in max-w-4xl mx-auto shadow-2xl">
            {/* Top Header */}
            <div className="p-6 border-b border-white/5 bg-slate-800/50 flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Practice Question</span>
                    <h2 className="text-white font-bold">{currentIndex + 1} of {questions.length}</h2>
                </div>
                <div className="bg-slate-900 rounded-lg px-3 py-1 text-sm font-medium text-slate-400 border border-white/5">
                    Mode: Interactive
                </div>
            </div>

            <div className="p-8">
                {/* Question Text */}
                <h3 className="text-2xl font-medium text-white mb-10 leading-relaxed">
                    {currentQuestion.question_text}
                </h3>

                {/* Question Type Content */}
                <div className="mb-10 min-h-[200px]">
                    {currentQuestion.question_type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options?.map((option: string, idx: number) => {
                                const isSelected = selectedOption === idx;
                                const isCorrectOpt = idx === parseInt(currentQuestion.correct_answer || '0');

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !isAnswered && setSelectedOption(idx)}
                                        disabled={isAnswered}
                                        className={`p-5 rounded-xl border text-left transition-all ${isAnswered
                                            ? isCorrectOpt ? 'border-green-500 bg-green-500/10 text-green-400'
                                                : isSelected ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/5 bg-slate-800/30'
                                            : isSelected ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/10' : 'border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${isSelected ? 'border-current' : 'border-slate-600'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            {option}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {currentQuestion.question_type === 'input' && (
                        <div className="space-y-6">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isAnswered}
                                placeholder="Type your answer here..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-blue-500 transition-all min-h-[150px] resize-none"
                            />
                            {isAnswered && (
                                <div className="animate-fade-in-up space-y-6">
                                    <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                        <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Expected Answer:
                                        </h4>
                                        <p className="text-white text-lg">{currentQuestion.correct_answer}</p>
                                    </div>

                                    {isCorrect === null && (
                                        <div className="flex flex-col items-center gap-4 py-4">
                                            <p className="text-slate-400 text-sm font-medium">How did you do?</p>
                                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                                <button onClick={() => handleSelfCheck(false)} className="py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold flex items-center justify-center gap-2">
                                                    <X size={18} /> Incorrect
                                                </button>
                                                <button onClick={() => handleSelfCheck(true)} className="py-3 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold flex items-center justify-center gap-2">
                                                    <Check size={18} /> Correct
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {currentQuestion.question_type === 'drag_drop' && (
                        <div className="grid grid-cols-2 gap-12">
                            <div className="space-y-3">
                                {pairs.map((pair, idx) => (
                                    <div
                                        key={idx}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => !isAnswered && onDrop(idx)}
                                        className={`p-4 rounded-xl border flex items-center justify-between min-h-[80px] transition-all bg-slate-900 ${isAnswered
                                            ? (currentQuestion.options.find(o => o.left === pair.left)?.right === pair.right)
                                                ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                                : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                            : pair.right ? 'border-blue-500/20' : 'border-dashed border-white/10'
                                            }`}
                                    >
                                        <div className="flex-1 pr-4">
                                            <span className="text-xs text-slate-500 font-bold block mb-1">TERM</span>
                                            <span className="text-white font-medium">{pair.left}</span>
                                        </div>
                                        <div className="flex-1 pl-4 border-l border-white/5">
                                            <span className="text-xs text-slate-500 font-bold block mb-1">DEFINITION</span>
                                            {pair.right ? (
                                                <div className="flex items-center justify-between text-blue-400">
                                                    <span>{pair.right}</span>
                                                    {!isAnswered && (
                                                        <button
                                                            onClick={() => {
                                                                const newPairs = [...pairs];
                                                                const val = newPairs[idx].right;
                                                                newPairs[idx].right = null;
                                                                setPairs(newPairs);
                                                                if (val) setAvailableRight([...availableRight, val]);
                                                            }}
                                                            className="text-slate-600 hover:text-red-400"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 italic text-sm">Drop here</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Available Definitions</h4>
                                {availableRight.map((item, idx) => (
                                    <div
                                        key={idx}
                                        draggable={!isAnswered}
                                        onDragStart={() => onDragStart(idx, 'right')}
                                        className="p-4 bg-slate-800 border border-white/5 rounded-xl text-slate-200 cursor-move hover:border-blue-500/50 hover:bg-slate-700 transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        <GripVertical size={16} className="text-slate-600" />
                                        {item}
                                    </div>
                                ))}
                                {availableRight.length === 0 && (
                                    <div className="p-8 border border-dashed border-white/5 rounded-xl text-center text-slate-600 text-sm italic">
                                        All items paired
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center mt-12 bg-slate-900/50 -mx-8 -mb-8 p-8">
                    <div className="text-slate-500 text-sm font-medium">
                        {isAnswered && isCorrect !== null && (
                            <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {isCorrect ? <Check size={18} /> : <X size={18} />}
                                <span className="font-bold">{isCorrect ? 'Correct!' : 'Keep trying!'}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {!isAnswered ? (
                            <button
                                onClick={handleCheck}
                                disabled={
                                    (currentQuestion.question_type === 'mcq' && selectedOption === null) ||
                                    (currentQuestion.question_type === 'drag_drop' && availableRight.length > 0)
                                }
                                className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                            >
                                {currentQuestion.question_type === 'input' ? 'Check Model Answer' : 'Check Answer'}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                            >
                                Next Question
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
