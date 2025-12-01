'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, Upload, Edit, Trash2, Eye, Loader2, Sparkles } from 'lucide-react';
import { callDub5AI } from '@/lib/dub5';

export default function AdminLeersetsPage() {
    const { user, profile } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [leersets, setLeersets] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [newLeersetName, setNewLeersetName] = useState('');
    const [importing, setImporting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiContext, setAiContext] = useState('');

    useEffect(() => {
        if (user) {
            fetchSubjects();
            fetchLeersets();
        }
    }, [user]);

    useEffect(() => {
        if (selectedSubject) {
            fetchLeersets();
        }
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        const { data } = await supabase.from('subjects').select('*').order('name');
        setSubjects(data || []);
    };

    const fetchLeersets = async () => {
        let query = supabase.from('leersets').select('*, subject:subjects(name, color), items:leersetitems(count)');

        if (selectedSubject) {
            query = query.eq('subject_id', selectedSubject);
        }

        const { data } = await query.order('created_at', { ascending: false });
        setLeersets(data || []);
    };

    const createLeerset = async () => {
        if (!newLeersetName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('leersets')
                .insert({
                    name: newLeersetName,
                    subject_id: selectedSubject || null,
                    user_id: user!.id,
                })
                .select()
                .single();

            if (error) throw error;

            setNewLeersetName('');
            setShowImportModal(true);
            fetchLeersets();
        } catch (error) {
            console.error('Error creating leerset:', error);
            alert('Kon leerset niet aanmaken');
        }
    };

    const importLeersetText = async (leersetId: string) => {
        if (!importText.trim()) return;

        setImporting(true);

        try {
            const response = await fetch('/api/leersets/import-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leersetId,
                    text: importText,
                    userId: user!.id,
                }),
            });

            if (!response.ok) throw new Error('Import failed');

            const result = await response.json();
            alert(`Succesvol ${result.count} items geïmporteerd!`);

            setImportText('');
            setShowImportModal(false);
            fetchLeersets();
        } catch (error) {
            console.error('Import error:', error);
            alert('Import mislukt. Controleer het formaat.');
        } finally {
            setImporting(false);
        }
    };

    const generateFlashcardsFromAI = async () => {
        if (!aiContext.trim()) return;

        setGenerating(true);

        try {
            const result = await callDub5AI(
                `Generate 15 flashcards from this text. Format each as "term: definition" on separate lines:\n\n${aiContext}`,
                'extract',
                { format: 'flashcards', count: 15 }
            );

            // Parse AI result into importable format
            const lines = result.split('\n').filter(l => l.trim());
            const formatted = lines.map(line => {
                const [term, ...defParts] = line.split(':');
                return `${term.trim()} ${defParts.join(':').trim()}`;
            }).join('\n');

            setImportText(formatted);
            setAiContext('');
            alert('AI heeft flashcards gegenereerd! Controleer en importeer.');
        } catch (error) {
            console.error('AI generation error:', error);
            alert('AI generatie mislukt. Probeer opnieuw.');
        } finally {
            setGenerating(false);
        }
    };

    const deleteLeerset = async (id: string) => {
        if (!confirm('Weet je zeker dat je deze leerset wilt verwijderen?')) return;

        try {
            const { error } = await supabase.from('leersets').delete().eq('id', id);
            if (error) throw error;
            fetchLeersets();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Kon leerset niet verwijderen');
        }
    };

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        return (
            <Layout>
                <div className="text-center py-16">
                    <p className="text-red-600 dark:text-red-400">
                        Je hebt geen toegang tot deze pagina.
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Leersets Beheren
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Maak en beheer leersets voor studenten
                        </p>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row gap-4">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                            <option value="">Alle vakken</option>
                            {subjects.map((subject: any) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Nieuwe leerset naam..."
                            value={newLeersetName}
                            onChange={(e) => setNewLeersetName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createLeerset()}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />

                        <button
                            onClick={createLeerset}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Aanmaken
                        </button>
                    </div>
                </div>

                {/* Leersets List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leersets.map((leerset: any) => (
                        <div
                            key={leerset.id}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                        {leerset.name}
                                    </h3>
                                    {leerset.subject && (
                                        <span
                                            className="text-xs px-2 py-1 rounded inline-block"
                                            style={{
                                                backgroundColor: `${leerset.subject.color}20`,
                                                color: leerset.subject.color
                                            }}
                                        >
                                            {leerset.subject.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                {leerset.items?.[0]?.count || 0} items
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowImportModal(true);
                                        // Store current leerset ID for import
                                    }}
                                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <Upload className="w-4 h-4" />
                                    Import
                                </button>
                                <button
                                    onClick={() => deleteLeerset(leerset.id)}
                                    className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                Import Items
                            </h2>

                            {/* AI Generator Section */}
                            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    AI Flashcard Generator
                                </h3>
                                <textarea
                                    value={aiContext}
                                    onChange={(e) => setAiContext(e.target.value)}
                                    placeholder="Plak tekst hier en AI genereert automatisch flashcards..."
                                    className="w-full h-32 px-3 py-2 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white mb-3"
                                />
                                <button
                                    onClick={generateFlashcardsFromAI}
                                    disabled={generating || !aiContext.trim()}
                                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Genereren...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Genereer Flashcards
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                Formaat: Elke regel moet zijn "begrip definitie"
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                                Voorbeeld: fotosynthese Het proces waarbij planten licht omzetten in energie
                            </p>

                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="begrip1 definitie1&#10;begrip2 definitie2&#10;begrip3 definitie3"
                                className="w-full h-64 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm mb-4"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={() => importLeersetText(leersets[0]?.id)} // You'd need to pass the actual leerset ID
                                    disabled={importing || !importText.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Importeren...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Importeren
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
