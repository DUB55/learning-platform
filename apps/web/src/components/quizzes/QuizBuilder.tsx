'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Check, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import ErrorLogger from '@/lib/ErrorLogger';

type QuestionType = 'mcq' | 'open' | 'fill_in_blank';

type QuestionDraft = {
    id: string; // temp id
    text: string;
    type: QuestionType;
    options: string[];
    correctIndex: number;
    correctAnswer: string; // for open/fill_in_blank
    explanation: string;
};

export default function QuizBuilder({ unitId, userId, onCancel }: { unitId: string, userId: string, onCancel: () => void }) {
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        { id: '1', text: '', type: 'mcq', options: ['', ''], correctIndex: 0, correctAnswer: '', explanation: '' }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const saveControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveControllerRef.current) {
                saveControllerRef.current.abort();
            }
        };
    }, []);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now().toString(), text: '', type: 'mcq', options: ['', ''], correctIndex: 0, correctAnswer: '', explanation: '' }
        ]);
    };

    const updateQuestion = (
        index: number,
        field: keyof QuestionDraft,
        value: string | number | QuestionType
    ) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setQuestions(newQuestions);
    };

    const addOption = (qIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length >= 6) return; // Limit options
        newQuestions[qIndex].options.push('');
        setQuestions(newQuestions);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length <= 2) return;
        newQuestions[qIndex].options.splice(oIndex, 1);
        if (newQuestions[qIndex].correctIndex >= oIndex && newQuestions[qIndex].correctIndex > 0) {
            newQuestions[qIndex].correctIndex--;
        }
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions.length <= 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) return showToast('Please enter a quiz title', 'error');
        if (questions.some(q => !q.text.trim())) return showToast('All questions must have text', 'error');
        if (questions.some(q => q.type === 'mcq' && q.options.some(o => !o.trim()))) return showToast('All options must be filled', 'error');
        if (questions.some(q => (q.type === 'open' || q.type === 'fill_in_blank') && !q.correctAnswer.trim())) return showToast('Please provide a correct answer', 'error');

        // Abort previous save if any
        if (saveControllerRef.current) {
            saveControllerRef.current.abort();
        }
        saveControllerRef.current = new AbortController();
        const signal = saveControllerRef.current.signal;

        setIsSaving(true);
        try {
            // 1. Create Quiz
            const { data: quizData, error: quizError } = await (supabase.from('quizzes') as any)
                .insert({
                    unit_id: unitId,
                    user_id: userId,
                    title,
                    description,
                    quiz_type: 'custom'
                })
                .select()
                .abortSignal(signal)
                .single();

            if (quizError) throw quizError;

            // 2. Create Questions
            const questionsPayload = questions.map(q => ({
                quiz_id: quizData.id,
                question_text: q.text,
                question_type: q.type,
                options: q.type === 'mcq' ? q.options : null,
                correct_option_index: q.type === 'mcq' ? q.correctIndex : null,
                correct_answer: q.type !== 'mcq' ? q.correctAnswer : null,
                explanation: q.explanation
            }));

            const { error: questionsError } = await (supabase.from('quiz_questions') as any)
                .insert(questionsPayload)
                .abortSignal(signal);

            if (questionsError) throw questionsError;

            showToast('Quiz created successfully!', 'success');
            window.location.reload();

        } catch (error: unknown) {
            if ((error as any).name === 'AbortError') return;
            const message = error instanceof Error ? error.message : 'Unknown error';
            ErrorLogger.error('Error saving quiz', error);
            showToast('Failed to save quiz: ' + message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[#1e293b] rounded-xl border border-white/10 p-6 animate-fade-in">
            <div className="mb-8">
                <label className="block text-slate-400 text-sm mb-2">Quiz Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 1 Review"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-bold mb-4 focus:outline-none focus:border-blue-500"
                />

                <label className="block text-slate-400 text-sm mb-2">Description (Optional)</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this quiz..."
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                />
            </div>

            <div className="space-y-8">
                {questions.map((q, qIndex) => (
                    <div key={q.id} className="bg-slate-900/50 rounded-xl p-6 border border-white/5 relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                                value={q.type}
                                onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                className="bg-slate-800 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none"
                            >
                                <option value="mcq">Multiple Choice</option>
                                <option value="open">Open Ended</option>
                                <option value="fill_in_blank">Fill in Blank</option>
                            </select>
                            <button
                                onClick={() => removeQuestion(qIndex)}
                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Question {qIndex + 1}</span>
                            <input
                                type="text"
                                value={q.text}
                                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                placeholder="Enter your question here..."
                                className="w-full bg-transparent border-b border-white/10 py-2 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                            />
                        </div>

                        {q.type === 'mcq' ? (
                            <div className="space-y-3">
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                            className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                                                ${q.correctIndex === oIndex
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-slate-600 hover:border-slate-400'
                                                }`}
                                        >
                                            {q.correctIndex === oIndex && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className={`flex-1 bg-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none border border-transparent focus:border-blue-500
                                                ${q.correctIndex === oIndex ? 'ring-1 ring-green-500/50' : ''}
                                            `}
                                        />
                                        {q.options.length > 2 && (
                                            <button onClick={() => removeOption(qIndex, oIndex)} className="text-slate-600 hover:text-red-400">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addOption(qIndex)}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium ml-9"
                                >
                                    + Add Option
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="block text-slate-400 text-xs font-bold uppercase">Correct Answer / Model Answer</label>
                                <textarea
                                    value={q.correctAnswer}
                                    onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                                    placeholder={q.type === 'open' ? "Enter the model answer that students will compare theirs with..." : "Enter the exact answer students need to type..."}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                                />
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-white/5">
                            <input
                                type="text"
                                value={q.explanation}
                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                placeholder="Explanation (optional) - shown after answering"
                                className="w-full bg-transparent text-sm text-slate-400 focus:text-white focus:outline-none placeholder:text-slate-700"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
                <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Question
                </button>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}
