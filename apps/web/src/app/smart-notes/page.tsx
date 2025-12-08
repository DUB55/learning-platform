'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, Sparkles, Bold, Italic, List,
    ListOrdered, Heading1, Heading2, Quote, Code,
    Loader2, Lightbulb, Wand2, BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { dub5ai } from '@/lib/dub5ai';

export default function SmartNotesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (content && title) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            autoSaveTimerRef.current = setTimeout(() => {
                saveNote();
            }, 30000);
        }
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [content, title]);

    const saveNote = async () => {
        if (!title.trim() || !content.trim() || !user) return;

        setIsSaving(true);
        try {
            const { error } = await (supabase.from('smart_notes') as any)
                .upsert({
                    user_id: user.id,
                    title: title.trim(),
                    content: content,
                    updated_at: new Date().toISOString(),
                });

            if (!error) {
                setLastSaved(new Date());
            }
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const enhanceWithAI = async (action: 'improve' | 'summarize' | 'expand' | 'keypoints') => {
        if (!content.trim()) return;

        setIsEnhancing(true);
        setShowSuggestion(false);

        try {
            let prompt = '';
            switch (action) {
                case 'improve':
                    prompt = `Improve and enhance the following text while maintaining its meaning. Fix grammar, improve clarity, and make it more professional:\n\n${content}`;
                    break;
                case 'summarize':
                    prompt = `Create a concise summary of the following text:\n\n${content}`;
                    break;
                case 'expand':
                    prompt = `Expand on the following text with more details, examples, and explanations:\n\n${content}`;
                    break;
                case 'keypoints':
                    prompt = `Extract the key points from the following text as a bullet list:\n\n${content}`;
                    break;
            }

            const response = await dub5ai.streamRequest(prompt, {
                task: 'enhance_notes'
            });

            setAiSuggestion(response);
            setShowSuggestion(true);
        } catch (error) {
            console.error('AI enhancement error:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const applySuggestion = () => {
        setContent(aiSuggestion);
        setShowSuggestion(false);
        setAiSuggestion('');
    };

    const insertFormatting = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

        setContent(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col">
            {/* Header */}
            <header className="glass-card rounded-none border-x-0 border-t-0 p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">Smart Notes</h1>
                                <p className="text-xs text-slate-400">AI-Enhanced Note Taking</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="text-xs text-slate-500">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={saveNote}
                            disabled={isSaving || !title.trim() || !content.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 flex flex-col">
                        {/* Title Input */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title..."
                            className="text-2xl font-bold bg-transparent border-none text-white placeholder:text-slate-600 focus:outline-none mb-4"
                        />

                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1 mb-4 p-2 bg-slate-800/50 rounded-lg border border-white/10">
                            <button
                                onClick={() => insertFormatting('**', '**')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Bold"
                            >
                                <Bold size={16} />
                            </button>
                            <button
                                onClick={() => insertFormatting('*', '*')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Italic"
                            >
                                <Italic size={16} />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <button
                                onClick={() => insertFormatting('# ')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Heading 1"
                            >
                                <Heading1 size={16} />
                            </button>
                            <button
                                onClick={() => insertFormatting('## ')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Heading 2"
                            >
                                <Heading2 size={16} />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <button
                                onClick={() => insertFormatting('- ')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Bullet List"
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => insertFormatting('1. ')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Numbered List"
                            >
                                <ListOrdered size={16} />
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                            <button
                                onClick={() => insertFormatting('> ')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Quote"
                            >
                                <Quote size={16} />
                            </button>
                            <button
                                onClick={() => insertFormatting('`', '`')}
                                className="p-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Code"
                            >
                                <Code size={16} />
                            </button>
                        </div>

                        {/* Text Area */}
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Start writing your notes here... Use Markdown for formatting."
                            className="flex-1 bg-slate-800/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none font-mono text-sm leading-relaxed min-h-[400px]"
                        />
                    </div>

                    {/* AI Panel */}
                    <div className="space-y-4">
                        <div className="glass-card p-4">
                            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <Wand2 className="w-4 h-4 text-purple-400" />
                                AI Enhancements
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => enhanceWithAI('improve')}
                                    disabled={isEnhancing || !content.trim()}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Sparkles className="w-4 h-4 text-blue-400 group-hover:animate-pulse" />
                                        Improve Writing
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Fix grammar and enhance clarity</p>
                                </button>
                                <button
                                    onClick={() => enhanceWithAI('summarize')}
                                    disabled={isEnhancing || !content.trim()}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Lightbulb className="w-4 h-4 text-amber-400" />
                                        Summarize
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Create a concise summary</p>
                                </button>
                                <button
                                    onClick={() => enhanceWithAI('keypoints')}
                                    disabled={isEnhancing || !content.trim()}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <List className="w-4 h-4 text-emerald-400" />
                                        Extract Key Points
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Get bullet points of key ideas</p>
                                </button>
                                <button
                                    onClick={() => enhanceWithAI('expand')}
                                    disabled={isEnhancing || !content.trim()}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors disabled:opacity-50 group"
                                >
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <BookOpen className="w-4 h-4 text-purple-400" />
                                        Expand Content
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Add more details and examples</p>
                                </button>
                            </div>
                        </div>

                        {/* AI Loading */}
                        {isEnhancing && (
                            <div className="glass-card p-4 text-center">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">AI is processing...</p>
                            </div>
                        )}

                        {/* AI Suggestion */}
                        {showSuggestion && aiSuggestion && (
                            <div className="glass-card p-4">
                                <h3 className="text-sm font-medium text-white mb-3">AI Suggestion</h3>
                                <div className="bg-slate-800/50 rounded-lg p-3 max-h-64 overflow-y-auto mb-3">
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{aiSuggestion}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={applySuggestion}
                                        className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-400 transition-colors"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={() => setShowSuggestion(false)}
                                        className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="glass-card p-4">
                            <h3 className="text-sm font-medium text-white mb-3">Note Stats</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Words</span>
                                    <span className="text-white">{content.trim().split(/\s+/).filter(Boolean).length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Characters</span>
                                    <span className="text-white">{content.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Lines</span>
                                    <span className="text-white">{content.split('\n').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
