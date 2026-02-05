'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, FileText, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import ErrorLogger from '@/lib/ErrorLogger';

type PracticeQuestionDraft = {
    id: string; // temp
    text: string;
    type: 'mcq' | 'input' | 'drag_drop';
    options: string[] | { left: string; right: string }[] | null;
    correctAnswer: string;
};

const EXAMPLE_FORMAT = `[1] What is the capital of France?
* Paris
- London
- Berlin
- Madrid
Ans: 0

[2] Describe the greenhouse effect.
Ans: The process where heat is trapped near Earth's surface by greenhouse gases.

[3] Match the following countries with their capitals:
L: Netherlands | R: Amsterdam
L: Germany | R: Berlin
L: France | R: Paris
`;

export default function PracticeQuestionImporter({ paragraphId, userId }: { paragraphId: string, userId: string }) {
    const { showToast } = useToast();
    const [mode, setMode] = useState<'manual' | 'automated'>('manual');
    const [bulkText, setBulkText] = useState('');
    const [questions, setQuestions] = useState<PracticeQuestionDraft[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const parseAutomated = () => {
        try {
            const parsedQuestions: PracticeQuestionDraft[] = [];
            const blocks = bulkText.split(/\[\d+\]/).filter(b => b.trim());

            blocks.forEach((block, idx) => {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                const questionText = lines[0];

                if (block.includes('*') || block.includes('-')) {
                    // MCQ
                    const options = lines.filter(l => l.startsWith('*') || l.startsWith('-')).map(l => l.substring(1).trim());
                    const correctIdx = lines.findIndex(l => l.startsWith('*')) - 1; // Simplistic but example format had * for correct
                    const ansLine = lines.find(l => l.toLowerCase().startsWith('ans:'));
                    const ansVal = ansLine ? ansLine.split(':')[1].trim() : correctIdx.toString();

                    parsedQuestions.push({
                        id: Date.now().toString() + idx,
                        text: questionText,
                        type: 'mcq',
                        options,
                        correctAnswer: ansVal
                    });
                } else if (block.includes('L:')) {
                    // Drag Drop
                    const pairs = lines.filter(l => l.includes('L:')).map(l => {
                        const [leftPart, rightPart] = l.split('|');
                        return {
                            left: leftPart.replace('L:', '').trim(),
                            right: rightPart.replace('R:', '').trim()
                        };
                    });
                    parsedQuestions.push({
                        id: Date.now().toString() + idx,
                        text: questionText,
                        type: 'drag_drop',
                        options: pairs,
                        correctAnswer: ''
                    });
                } else {
                    // Input
                    const ansLine = lines.find(l => l.toLowerCase().startsWith('ans:'));
                    const ansVal = ansLine ? ansLine.split(':')[1].trim() : '';
                    parsedQuestions.push({
                        id: Date.now().toString() + idx,
                        text: questionText,
                        type: 'input',
                        options: null,
                        correctAnswer: ansVal
                    });
                }
            });

            setQuestions([...questions, ...parsedQuestions]);
            setMode('manual');
            showToast(`Parsed ${parsedQuestions.length} questions successfully!`, 'success');
        } catch (err) {
            ErrorLogger.error('Failed to parse practice questions', err);
            showToast('Failed to parse text. Please check the format.', 'error');
        }
    };

    const handleSave = async () => {
        if (questions.length === 0) return;
        setIsSaving(true);
        try {
            const payload = questions.map(q => ({
                paragraph_id: paragraphId,
                question_text: q.text,
                question_type: q.type,
                options: q.options,
                correct_answer: q.correctAnswer,
                created_by: userId,
                is_public: true
            }));

            const { error } = await supabase.from('practice_questions').insert(payload);
            if (error) throw error;

            showToast('Questions saved successfully!', 'success');
            setQuestions([]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            showToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Import Practice Questions</h2>
                        <p className="text-slate-400 text-sm">Organize your book content easily.</p>
                    </div>
                </div>

                <div className="flex bg-[#0f172a] rounded-xl p-1 border border-white/5">
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Manual Entries ({questions.length})
                    </button>
                    <button
                        onClick={() => setMode('automated')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'automated' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Bulk Import
                    </button>
                </div>
            </div>

            {mode === 'automated' ? (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-4">
                        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-blue-200 font-bold mb-1">How it works:</p>
                            <p className="text-blue-300 opacity-80 leading-relaxed">
                                Paste your text below. Use <code className="bg-blue-500/20 px-1 rounded">[1]</code> for question numbers.
                                For MCQ, use <code className="bg-blue-500/20 px-1 rounded">-</code> for options and <code className="bg-blue-500/20 px-1 rounded">*</code> for the correct one.
                                For Drag Drop, use <code className="bg-blue-500/20 px-1 rounded">L: term | R: definition</code>.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Input Text</label>
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                className="w-full bg-[#0f172a] border border-white/10 rounded-2xl p-6 text-slate-300 text-sm font-mono h-[400px] focus:outline-none focus:ring-2 ring-blue-500/20"
                                placeholder={`Paste content here...\n\nExample:\n${EXAMPLE_FORMAT}`}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Sample Format Reference</label>
                            <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 text-slate-500 text-xs font-mono h-[400px] overflow-y-auto">
                                <pre>{EXAMPLE_FORMAT}</pre>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={parseAutomated}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-xl shadow-blue-600/20"
                        >
                            <CheckCircle2 size={18} />
                            Parse & Process
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {questions.length === 0 ? (
                        <div className="p-20 border-2 border-dashed border-white/5 rounded-3xl text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <FileText className="text-slate-600" />
                            </div>
                            <p className="text-slate-400 font-medium mb-6">No questions added yet. Use Bulk Import to speed things up!</p>
                            <button
                                onClick={() => setQuestions([{ id: '1', text: '', type: 'mcq' as const, options: ['', ''], correctAnswer: '0' }])}
                                className="text-blue-400 font-bold flex items-center gap-2 hover:text-blue-300"
                            >
                                <Plus size={18} /> Add first question manually
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="relative bg-slate-800/30 border border-white/5 p-6 rounded-2xl group transition-all hover:bg-slate-800/50">
                                    <div className="absolute -left-3 top-6 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-lg">
                                        {idx + 1}
                                    </div>
                                    <button
                                        onClick={() => setQuestions(questions.filter(qu => qu.id !== q.id))}
                                        className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-12 gap-6">
                                        <div className="col-span-8">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Question Content</label>
                                            <input
                                                value={q.text}
                                                onChange={(e) => {
                                                    const nq = [...questions];
                                                    nq[idx].text = e.target.value;
                                                    setQuestions(nq);
                                                }}
                                                className="w-full bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-blue-500 py-2"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label>
                                            <select
                                                value={q.type}
                                                onChange={(e) => {
                                                    const nq = [...questions];
                                                    nq[idx].type = e.target.value as PracticeQuestionDraft['type'];
                                                    setQuestions(nq);
                                                }}
                                                className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="mcq">Multiple Choice</option>
                                                <option value="input">Input / Open</option>
                                                <option value="drag_drop">Drag & Drop Pairing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        {q.type === 'mcq' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Options</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(q.options as string[]).map((opt, oidx) => (
                                                        <input
                                                            key={oidx}
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const nq = [...questions];
                                                                nq[idx].options[oidx] = e.target.value;
                                                                setQuestions(nq);
                                                            }}
                                                            placeholder={`Option ${oidx + 1}`}
                                                            className={`bg-[#0f172a] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 ${q.correctAnswer === oidx.toString() ? 'ring-2 ring-green-500/50 border-green-500/50' : ''}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {(q.type === 'input' || q.type === 'drag_drop') && (
                                            <div className="p-4 bg-[#0f172a] rounded-xl border border-white/5 text-xs text-slate-500">
                                                {q.type === 'input' ? 'Model answer will be shown for self-check.' : `${q.options?.length || 0} pairs defined.`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setQuestions([...questions, { id: Date.now().toString(), text: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '0' }])}
                                className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-slate-500 hover:text-white hover:border-white/20 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Add More Manual Questions
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-8 border-t border-white/5">
                        <p className="text-slate-500 text-sm">
                            Ready to publish <span className="text-blue-400 font-bold">{questions.length}</span> questions.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || questions.length === 0}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-green-600/20"
                        >
                            {isSaving ? <Upload className="animate-bounce" size={18} /> : <Save size={18} />}
                            {isSaving ? 'Uploading to DB...' : 'Save & Publish All'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
}
