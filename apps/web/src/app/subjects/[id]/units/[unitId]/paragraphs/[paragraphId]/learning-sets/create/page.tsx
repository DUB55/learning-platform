'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Plus, ArrowLeft, Upload, X, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dub5ai } from '@/lib/dub5ai';

interface TermDefinitionPair {
    id: string;
    term: string;
    definition: string;
}

export default function CreateLearningSetPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const paragraphId = params.paragraphId as string;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [pairs, setPairs] = useState<TermDefinitionPair[]>([
        { id: '1', term: '', definition: '' },
        { id: '2', term: '', definition: '' },
        { id: '3', term: '', definition: '' },
        { id: '4', term: '', definition: '' },
    ]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [aiContext, setAiContext] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [termSeparator, setTermSeparator] = useState('tab');
    const [pairSeparator, setPairSeparator] = useState('newline');
    const [customTermSep, setCustomTermSep] = useState('');
    const [customPairSep, setCustomPairSep] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleAIGenerate = async () => {
        if (!aiContext.trim()) return;

        setIsGeneratingAI(true);
        try {
            const generatedPairs = await dub5ai.generateLearningSet(aiContext);

            const newPairs = generatedPairs.map(p => ({
                id: Date.now().toString() + Math.random(),
                term: p.term,
                definition: p.definition
            }));

            setPairs(newPairs);
            setShowAIModal(false);
            setAiContext('');
        } catch (error) {
            console.error('AI Generation error:', error);
            alert('Failed to generate learning set. Please try again.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const addPair = () => {
        setPairs([...pairs, { id: Date.now().toString(), term: '', definition: '' }]);
    };

    const removePair = (id: string) => {
        if (pairs.length > 1) {
            setPairs(pairs.filter(p => p.id !== id));
        }
    };

    const updatePair = (id: string, field: 'term' | 'definition', value: string) => {
        setPairs(pairs.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImport = () => {
        if (!importText.trim()) {
            alert('Please enter text to import');
            return;
        }

        try {
            let termSep = termSeparator;
            let pairSep = pairSeparator;

            if (termSeparator === 'custom') {
                if (!customTermSep) {
                    alert('Please enter a custom term separator');
                    return;
                }
                termSep = customTermSep;
            } else if (termSeparator === 'tab') {
                termSep = '\t';
            } else if (termSeparator === 'equals') {
                termSep = ' = ';
            }

            if (pairSeparator === 'custom') {
                if (!customPairSep) {
                    alert('Please enter a custom pair separator');
                    return;
                }
                pairSep = customPairSep;
            } else if (pairSeparator === 'newline') {
                pairSep = '\n';
            } else if (pairSeparator === 'semicolon') {
                pairSep = ';';
            }

            const lines = importText.split(pairSep);
            const imported: TermDefinitionPair[] = [];

            for (const line of lines) {
                if (!line.trim()) continue;

                const parts = line.split(termSep);
                if (parts.length >= 2) {
                    imported.push({
                        id: Date.now().toString() + Math.random(),
                        term: parts[0].trim(),
                        definition: parts.slice(1).join(termSep).trim()
                    });
                }
            }

            if (imported.length === 0) {
                alert('No valid term-definition pairs found. Please check your format and separators.');
                return;
            }

            setPairs(imported);
            setShowImportModal(false);
            setImportText('');
        } catch (error) {
            alert('Error parsing import text. Please check your format.');
        }
    };

    const handleCreate = async () => {
        if (!user || !title.trim()) {
            alert('Please enter a title');
            return;
        }

        const validPairs = pairs.filter(p => p.term.trim() && p.definition.trim());

        if (validPairs.length === 0) {
            alert('Please add at least one term-definition pair');
            return;
        }

        setIsCreating(true);

        try {
            // Create learning set
            const { data: setData, error: setError } = await supabase
                .from('learning_sets')
                .insert([{
                    paragraph_id: paragraphId,
                    user_id: user.id,
                    title: title,
                    description: description || null
                }])
                .select()
                .single();

            if (setError) throw setError;

            // Create items
            const items = validPairs.map((pair, index) => ({
                learning_set_id: setData.id,
                term: pair.term,
                definition: pair.definition,
                order_index: index
            }));

            const { error: itemsError } = await supabase
                .from('learning_set_items')
                .insert(items);

            if (itemsError) throw itemsError;

            // Navigate to the learning set view
            router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${paragraphId}/learning-sets/${setData.id}`);
        } catch (error) {
            console.error('Error creating learning set:', error);
            alert('Failed to create learning set');
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-y-auto relative p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>

                    <div className="mb-10">
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Create Learning Set</h1>
                        <p className="text-slate-400">Add terms and definitions for your study set</p>
                    </div>

                    {/* Title and Description */}
                    <div className="glass-card p-6 mb-6">
                        <div className="mb-4">
                            <label className="block text-slate-400 text-sm mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter learning set title"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter description"
                                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-20 resize-none focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Import & AI Buttons */}
                    <div className="flex justify-end gap-3 mb-4">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Generate with AI</span>
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="glass-button px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Import</span>
                        </button>
                    </div>

                    {/* Term-Definition Pairs */}
                    <div className="space-y-3 mb-6">
                        {pairs.map((pair, index) => (
                            <div key={pair.id} className="glass-card p-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-500 font-mono text-sm w-8">{index + 1}</span>
                                    <input
                                        type="text"
                                        value={pair.term}
                                        onChange={(e) => updatePair(pair.id, 'term', e.target.value)}
                                        placeholder="Term"
                                        className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="text-slate-600">–</span>
                                    <input
                                        type="text"
                                        value={pair.definition}
                                        onChange={(e) => updatePair(pair.id, 'definition', e.target.value)}
                                        placeholder="Definition"
                                        className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                    {pairs.length > 1 && (
                                        <button
                                            onClick={() => removePair(pair.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Pair Button */}
                    <button
                        onClick={addPair}
                        className="w-full glass-card p-4 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 mb-8"
                    >
                        <Plus className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-medium">Add Pair</span>
                    </button>

                    {/* Create Button */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || !title.trim()}
                            className="flex-1 glass-button rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'Creating...' : 'Create Learning Set'}
                        </button>
                    </div>
                </div>
            </main>

            {/* AI Generation Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Generate with Dub5 AI</h2>
                                    <p className="text-xs text-slate-400">Powered by advanced learning models</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAIModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <p className="text-slate-400 mb-6">
                            Paste your notes, article, or any text below. Dub5 AI will automatically extract key terms and definitions for you.
                        </p>

                        <textarea
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            placeholder="Paste your context here..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-48 resize-none focus:outline-none focus:border-blue-500 mb-6 text-sm"
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAIModal(false)}
                                className="flex-1 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAIGenerate}
                                disabled={isGeneratingAI || !aiContext.trim()}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingAI ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Generate Learning Set</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-card p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Import Term-Definition Pairs</h2>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <p className="text-slate-400 mb-6">
                            Paste your terms and definitions. Choose how they're separated:
                        </p>

                        {/* Separator Options */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-slate-400 text-sm mb-3">Between Term and Definition</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="termSep"
                                            value="tab"
                                            checked={termSeparator === 'tab'}
                                            onChange={(e) => setTermSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Tab</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="termSep"
                                            value="equals"
                                            checked={termSeparator === 'equals'}
                                            onChange={(e) => setTermSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Equals ( = )</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="termSep"
                                            value="custom"
                                            checked={termSeparator === 'custom'}
                                            onChange={(e) => setTermSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Custom</span>
                                    </label>
                                    {termSeparator === 'custom' && (
                                        <input
                                            type="text"
                                            value={customTermSep}
                                            onChange={(e) => setCustomTermSep(e.target.value)}
                                            placeholder="e.g., : or -"
                                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-3">Between Pairs</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="pairSep"
                                            value="newline"
                                            checked={pairSeparator === 'newline'}
                                            onChange={(e) => setPairSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">New Line</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="pairSep"
                                            value="semicolon"
                                            checked={pairSeparator === 'semicolon'}
                                            onChange={(e) => setPairSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Semicolon ( ; )</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="pairSep"
                                            value="custom"
                                            checked={pairSeparator === 'custom'}
                                            onChange={(e) => setPairSeparator(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Custom</span>
                                    </label>
                                    {pairSeparator === 'custom' && (
                                        <input
                                            type="text"
                                            value={customPairSep}
                                            onChange={(e) => setCustomPairSep(e.target.value)}
                                            placeholder="e.g., | or ,"
                                            className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Example */}
                        <div className="bg-slate-900/50 p-4 rounded-lg mb-6">
                            <p className="text-slate-400 text-sm mb-2">Example format:</p>
                            <code className="text-blue-300 text-sm">
                                {termSeparator === 'tab' && 'Term\tDefinition\nTerm2\tDefinition2'}
                                {termSeparator === 'equals' && 'Term = Definition\nTerm2 = Definition2'}
                                {termSeparator === 'custom' && `Term${customTermSep || '[sep]'}Definition\nTerm2${customTermSep || '[sep]'}Definition2`}
                            </code>
                        </div>

                        {/* Import Text Area */}
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Paste your terms and definitions here..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-48 resize-none focus:outline-none focus:border-blue-500 mb-6 font-mono text-sm"
                        />

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="flex-1 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                className="flex-1 glass-button rounded-lg"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
