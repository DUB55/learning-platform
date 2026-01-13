'use client';

import { useState } from 'react';
import { Plus, Trash2, Check, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

type QuestionDraft = {
    id: string; // temp id
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
};

export default function QuizBuilder({ unitId, userId, onCancel }: { unitId: string, userId: string, onCancel: () => void }) {
    const { showToast } = useToast();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        { id: '1', text: '', options: ['', ''], correctIndex: 0, explanation: '' }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now().toString(), text: '', options: ['', ''], correctIndex: 0, explanation: '' }
        ]);
    };

    const updateQuestion = (index: number, field: keyof QuestionDraft, value: any) => {
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
        if (questions.some(q => q.options.some(o => !o.trim()))) return showToast('All options must be filled', 'error');

        setIsSaving(true);
        try {
            // 1. Create Quiz
            const { data: quizData, error: quizError } = await (supabase.from('quizzes') as any)
                .insert({
                    unit_id: unitId,
                    user_id: userId,
                    title,
                    description
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Create Questions
            const questionsPayload = questions.map(q => ({
                quiz_id: quizData.id,
                question_text: q.text,
                options: q.options,
                correct_option_index: q.correctIndex,
                explanation: q.explanation
            }));

            const { error: questionsError } = await (supabase.from('quiz_questions') as any)
                .insert(questionsPayload);

            if (questionsError) throw questionsError;

            showToast('Quiz created successfully!', 'success');
            // Refresh or Redirect? 
            // For now, let's just reload the page or call a callback if provided. 
            // Actually, usually we redirect to the unit page.
            window.location.reload();

        } catch (error: any) {
            console.error('Error saving quiz:', error);
            showToast('Failed to save quiz: ' + error.message, 'error');
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
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
