'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Brain, Type, Download, Upload, X, HelpCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import ErrorLogger from '@/lib/ErrorLogger';

type TermDraft = {
    id: string;
    term: string;
    definition: string;
};

export default function LearningSetBuilder({ 
    paragraphId, 
    subjectId,
    userId, 
    onCancel 
}: { 
    paragraphId: string;
    subjectId: string;
    userId: string;
    onCancel: () => void;
}) {
    const { showToast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [terms, setTerms] = useState<TermDraft[]>([
        { id: '1', term: '', definition: '' },
        { id: '2', term: '', definition: '' }
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [importDelimiter, setImportDelimiter] = useState('\t'); // Tab by default (Quizlet style)

    const saveControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveControllerRef.current) {
                saveControllerRef.current.abort();
            }
        };
    }, []);

    const addTerm = () => {
        setTerms([...terms, { id: Date.now().toString(), term: '', definition: '' }]);
    };

    const updateTerm = (index: number, field: 'term' | 'definition', value: string) => {
        const newTerms = [...terms];
        newTerms[index][field] = value;
        setTerms(newTerms);
    };

    const removeTerm = (index: number) => {
        if (terms.length <= 1) return;
        setTerms(terms.filter((_, i) => i !== index));
    };

    const handleImport = () => {
        if (!importText.trim()) return;

        const lines = importText.split('\n');
        const importedTerms: TermDraft[] = lines
            .map(line => {
                const parts = line.split(importDelimiter);
                if (parts.length >= 2) {
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        term: parts[0].trim(),
                        definition: parts[1].trim()
                    };
                }
                return null;
            })
            .filter((t): t is TermDraft => t !== null);

        if (importedTerms.length === 0) {
            showToast('No valid terms found. Make sure you use the right separator.', 'error');
            return;
        }

        // Merge or replace? Let's append if current terms are empty-ish, else ask or just append
        const isEmpty = terms.length === 2 && !terms[0].term && !terms[1].term;
        if (isEmpty) {
            setTerms(importedTerms);
        } else {
            setTerms([...terms, ...importedTerms]);
        }

        setImportText('');
        setShowImport(false);
        showToast(`Imported ${importedTerms.length} terms!`, 'success');
    };

    const handleSave = async () => {
        if (!title.trim()) return showToast('Please enter a title', 'error');
        const validTerms = terms.filter(t => t.term.trim() && t.definition.trim());
        if (validTerms.length < 2) {
            return showToast('Add at least 2 terms with definitions', 'error');
        }

        // Abort previous save if any
        if (saveControllerRef.current) {
            saveControllerRef.current.abort();
        }
        saveControllerRef.current = new AbortController();
        const signal = saveControllerRef.current.signal;

        setIsSaving(true);
        try {
            // 1. Create Learning Set (in leersets table)
            const { data: setData, error: setError } = await (supabase.from('leersets') as any)
                .insert([{
                    title,
                    subject_id: subjectId,
                    created_by: userId
                }])
                .select()
                .abortSignal(signal)
                .single();

            if (setError) throw setError;

            // 2. Create Items
            const itemsPayload = validTerms.map(t => ({
                leerset_id: setData.id,
                term: t.term,
                definition: t.definition
            }));

            const { error: itemsError } = await (supabase.from('leerset_items') as any)
                .insert(itemsPayload)
                .abortSignal(signal);

            if (itemsError) throw itemsError;

            // 3. Link to paragraph
            const { error: linkError } = await (supabase.from('learning_sets') as any)
                .insert([{
                    title,
                    description,
                    paragraph_id: paragraphId,
                    subject_id: subjectId,
                    user_id: userId,
                    created_by: userId
                }])
                .abortSignal(signal);

            if (linkError) throw linkError;

            showToast('Learning set created successfully!', 'success');
            onCancel();
            window.location.reload();

        } catch (error: any) {
            if (error.name === 'AbortError') return;
            ErrorLogger.error('Error saving learning set', error);
            showToast('Failed to save learning set', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="glass-card p-6 border-white/5 bg-slate-900/40">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Chapter 1: Cellular Biology"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What will you learn in this set?"
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all h-20 resize-none placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="md:w-64 flex flex-col gap-3">
                        <button
                            onClick={() => setShowImport(true)}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm">Import from Quizlet</span>
                        </button>
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                                <HelpCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Pro Tip</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Use the import tool to quickly paste terms from Quizlet or Excel.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Cards ({terms.length})
                    </h2>
                </div>

                {terms.map((t, index) => (
                    <div key={t.id} className="group relative flex flex-col md:flex-row gap-4 bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {index + 1}
                        </div>
                        
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Term</label>
                            <input
                                type="text"
                                value={t.term}
                                onChange={(e) => updateTerm(index, 'term', e.target.value)}
                                placeholder="Enter term..."
                                className="w-full bg-transparent border-b-2 border-white/5 py-2 text-white font-medium focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-700"
                            />
                        </div>

                        <div className="flex-[1.5]">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Definition</label>
                            <input
                                type="text"
                                value={t.definition}
                                onChange={(e) => updateTerm(index, 'definition', e.target.value)}
                                placeholder="Enter definition..."
                                className="w-full bg-transparent border-b-2 border-white/5 py-2 text-white font-medium focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-700"
                            />
                        </div>

                        <button
                            onClick={() => removeTerm(index)}
                            className="absolute -right-2 -top-2 md:relative md:right-0 md:top-0 md:mt-6 p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addTerm}
                    className="w-full py-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-blue-500/20 hover:bg-blue-500/5 text-slate-500 hover:text-blue-400 transition-all group flex flex-col items-center justify-center gap-2"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest">Add New Card</span>
                </button>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-sm"
                >
                    Cancel
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="relative overflow-hidden group px-10 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition-all shadow-xl shadow-blue-600/20"
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Saving Set...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                <span>Save Learning Set</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </button>
                </div>
            </div>

            {/* Import Modal */}
            {showImport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowImport(false)} />
                    <div className="relative glass-card w-full max-w-2xl border-white/10 p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Import Terms</h3>
                                <p className="text-slate-400 text-sm">Paste your terms and definitions below.</p>
                            </div>
                            <button onClick={() => setShowImport(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Separator</label>
                                <div className="flex gap-3">
                                    {[
                                        { label: 'Tab', val: '\t' },
                                        { label: 'Comma', val: ',' },
                                        { label: 'Semicolon', val: ';' },
                                        { label: 'Dash', val: ' - ' }
                                    ].map((sep) => (
                                        <button
                                            key={sep.label}
                                            onClick={() => setImportDelimiter(sep.val)}
                                            className={`px-4 py-2 rounded-lg border transition-all text-xs font-bold ${
                                                importDelimiter === sep.val 
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                            }`}
                                        >
                                            {sep.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Paste Data</label>
                                <textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder={`term1${importDelimiter}definition1\nterm2${importDelimiter}definition2`}
                                    className="w-full h-64 bg-slate-900 border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                />
                            </div>

                            <button
                                onClick={handleImport}
                                className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Import {importText.split('\n').filter(l => l.includes(importDelimiter)).length} Cards</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
