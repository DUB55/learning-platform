'use client';

import { useState } from 'react';
import { X, Youtube, Loader2, FileText, Zap } from 'lucide-react';
import { generateFromYoutube } from '@/app/actions/generate';

interface YoutubeImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any, type: 'flashcards' | 'summary') => void;
    allowedModes?: ('flashcards' | 'summary')[];
}

export default function YoutubeImportModal({ isOpen, onClose, onSuccess, allowedModes = ['flashcards', 'summary'] }: YoutubeImportModalProps) {
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState<'flashcards' | 'summary'>(allowedModes[0]);
    const [summaryType, setSummaryType] = useState<'long' | 'normal' | 'short'>('normal');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await generateFromYoutube(url, {
                type: mode,
                summaryType: mode === 'summary' ? summaryType : undefined
            });

            if (result.success) {
                onSuccess(result.data, mode);
                onClose();
            } else {
                setError(result.error || 'Failed to generate content');
            }
        } catch (err) {
            setError('Something went wrong. Please check the URL.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1e293b] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-red-600/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Youtube className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">YouTube Import</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Video URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {allowedModes.includes('flashcards') && (
                            <button
                                type="button"
                                onClick={() => setMode('flashcards')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'flashcards'
                                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/20'
                                        : 'bg-[#0f172a] text-slate-400 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <Zap className="w-6 h-6" />
                                <span className="font-bold text-sm">Flashcards</span>
                            </button>
                        )}
                        {allowedModes.includes('summary') && (
                            <button
                                type="button"
                                onClick={() => setMode('summary')}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'summary'
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                                        : 'bg-[#0f172a] text-slate-400 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <FileText className="w-6 h-6" />
                                <span className="font-bold text-sm">Summary</span>
                            </button>
                        )}
                    </div>

                    {mode === 'summary' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Summary Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['short', 'normal', 'long'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setSummaryType(t)}
                                        className={`px-2 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${summaryType === t
                                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                                : 'bg-[#0f172a] text-slate-500 border-white/10 hover:text-slate-300'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Import Content'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
