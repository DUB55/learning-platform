'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { Plus, ArrowLeft, Upload, X, Trash2, Sparkles, Table } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dub5ai } from '@/lib/dub5ai';
import { learningSetSchema } from '@/lib/validation';
import YoutubeImportModal from '@/components/imports/YoutubeImportModal';
import FileImportModal from '@/components/imports/FileImportModal';
import CsvImportModal from '@/components/imports/CsvImportModal';



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
    const [showYoutubeModal, setShowYoutubeModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);

    const handleFileSuccess = (data: any, type: 'flashcards' | 'summary') => {
        if (type === 'flashcards' && Array.isArray(data)) {
            const newPairs = data.map((p: any) => ({
                id: Date.now().toString() + Math.random(),
                term: p.term || '',
                definition: p.definition || ''
            }));
            setPairs(prev => [...prev.filter(p => p.term || p.definition), ...newPairs]);
        }
    };


    const handleYoutubeSuccess = (data: any, type: 'flashcards' | 'summary') => {
        if (type === 'flashcards' && Array.isArray(data)) {
            const newPairs = data.map((p: any) => ({
                id: Date.now().toString() + Math.random(),
                term: p.term || '',
                definition: p.definition || ''
            }));
            setPairs(prev => [...prev.filter(p => p.term || p.definition), ...newPairs]);
        }
    };


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
        try {
            // Validate input
            const validationResult = learningSetSchema.safeParse({
                title,
                description,
                pairs: pairs
            });

            if (!validationResult.success) {
                const errorMessage = validationResult.error.errors[0].message;
                alert(errorMessage);
                return;
            }

            if (!user) {
                alert('You must be logged in');
                return;
            }

            setIsCreating(true);

            // Create learning set - database requires both user_id and created_by
            const { data: setData, error: setError } = await (supabase
                .from('learning_sets') as any)
                .insert([{
                    paragraph_id: paragraphId,
                    user_id: user.id,
                    created_by: user.id,
                    title: title,
                    description: description || null
                }])
                .select()
                .single();

            if (setError) {
                throw new Error(setError.message || 'Failed to create learning set');
            }

            // Create items
            const items = pairs
                .filter(p => p.term.trim() && p.definition.trim())
                .map((pair, index) => ({
                    learning_set_id: setData.id,
                    front_text: pair.term.trim(),
                    back_text: pair.definition.trim(),
                    order_index: index
                }));

            if (items.length > 0) {
                const { error: itemsError } = await (supabase
                    .from('flashcards') as any)
                    .insert(items);

                if (itemsError) {
                    throw new Error(itemsError.message || 'Failed to add terms');
                }
            }

            // Success - navigate without showing any error
            router.push(`/subjects/${params.id}/units/${params.unitId}/paragraphs/${params.paragraphId}/learning-sets/${setData.id}`);
        } catch (error: any) {
            console.error('Error creating learning set:', error);
            alert(`Failed to create learning set: ${error?.message || 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-8 relative text-white">

            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-white">Create New Learning Set</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                <div className="bg-slate-900 p-6 rounded-lg shadow-lg max-w-3xl mx-auto w-full">
                    <div className="mb-6">
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g., Key Terms from Chapter 1"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500"
                            placeholder="A brief description of this learning set"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 mb-6">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="glass-button flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                        >
                            <Sparkles size={18} /> Generate with AI
                        </button>
                        <button
                            onClick={() => setShowYoutubeModal(true)}
                            className="bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-red-900/20"
                        >
                            <Upload size={18} /> YouTube Import
                        </button>
                        <button
                            onClick={() => setShowFileModal(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-purple-900/20"
                        >
                            <Upload size={18} /> File Import
                        </button>
                        <button
                            onClick={() => setShowCsvModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20"
                        >
                            <Table size={18} /> CSV Import
                        </button>
                        <button

                            onClick={() => setShowImportModal(true)}
                            className="glass-button flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                        >

                            <Upload size={18} /> Import
                        </button>
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-4">Terms & Definitions</h2>
                    <div className="space-y-4 mb-6">
                        {pairs.map((pair, index) => (
                            <div key={pair.id} className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    value={pair.term}
                                    onChange={(e) => updatePair(pair.id, 'term', e.target.value)}
                                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Term"
                                />
                                <input
                                    type="text"
                                    value={pair.definition}
                                    onChange={(e) => updatePair(pair.id, 'definition', e.target.value)}
                                    className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="Definition"
                                />
                                <button
                                    onClick={() => removePair(pair.id)}
                                    className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-white/5 transition-colors"
                                    disabled={pairs.length === 1}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addPair}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-8"
                    >
                        <Plus size={20} /> Add another pair
                    </button>

                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="glass-button px-6 py-3 rounded-lg"
                            disabled={isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create Learning Set'}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Generation Modal */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Generate with AI</h2>
                            <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <p className="text-slate-300 mb-4">
                            Paste text from your paragraph or any relevant content. AI will extract key terms and definitions.
                        </p>
                        <textarea
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            placeholder="Paste text here for AI to analyze..."
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white h-48 resize-none focus:outline-none focus:border-blue-500 mb-6 font-mono text-sm"
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
                                className="flex-1 glass-button rounded-lg"
                                disabled={isGeneratingAI}
                            >
                                {isGeneratingAI ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Import Terms & Definitions</h2>
                            <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-slate-300 mb-4">
                                Paste your terms and definitions below. Choose your separators.
                            </p>

                            {/* Term Separator */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Term and Definition Separator</label>
                                <div className="flex flex-wrap gap-4">
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

                            {/* Pair Separator */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Each Pair Separator</label>
                                <div className="flex flex-wrap gap-4">
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
            )}

            <YoutubeImportModal
                isOpen={showYoutubeModal}
                onClose={() => setShowYoutubeModal(false)}
                onSuccess={handleYoutubeSuccess}
                allowedModes={['flashcards']}
            />

            <FileImportModal
                isOpen={showFileModal}
                onClose={() => setShowFileModal(false)}
                onSuccess={handleFileSuccess}
                allowedModes={['flashcards']}
            />

            <CsvImportModal
                isOpen={showCsvModal}
                onClose={() => setShowCsvModal(false)}
                onSuccess={(data) => {
                    const newPairs = data.map(p => ({
                        id: Date.now().toString() + Math.random(),
                        term: p.term,
                        definition: p.definition
                    }));
                    setPairs(prev => [...prev.filter(p => p.term || p.definition), ...newPairs]);
                }}
            />
        </div>

    );

}
