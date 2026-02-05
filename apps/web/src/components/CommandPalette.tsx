'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, FileText, BookOpen, Layers, 
    FileQuestion, Sparkles, X, Command,
    ArrowRight, Loader2, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { dub5ai } from '@/lib/dub5ai';

type SearchResult = {
    id: string;
    type: 'subject' | 'unit' | 'paragraph' | 'document' | 'learning_set' | 'quiz' | 'action';
    title: string;
    subtitle?: string;
    path: string;
};

const QUICK_ACTIONS: SearchResult[] = [
    { id: 'new-note', type: 'action', title: 'Create New Smart Note', subtitle: 'Open note editor', path: '/smart-notes' },
    { id: 'ai-chat', type: 'action', title: 'Ask DUB5 AI', subtitle: 'Start AI conversation', path: '/ai-chat' },
    { id: 'view-stats', type: 'action', title: 'View Learning Stats', subtitle: 'Check your progress', path: '/dashboard/stats' },
    { id: 'practice-quiz', type: 'action', title: 'Start Practice Quiz', subtitle: 'Test your knowledge', path: '/ai-chat?action=quiz' },
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSemantic, setIsSemantic] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { user } = useAuth();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Toggle open/close with Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setResults([]);
            setIsSemantic(false);
        }
    }, [isOpen]);

    const performSearch = useCallback(async (searchQuery: string, semantic: boolean = false, signal?: AbortSignal) => {
        if (!searchQuery.trim() || !user) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            if (semantic) {
                // Semantic Search via AI
                // 1. Fetch titles of everything in parallel
                const [docsRes, subjectsRes] = await Promise.all([
                    (supabase.from('smart_notes') as any)
                        .select('id, title, content')
                        .eq('user_id', user.id)
                        .abortSignal(signal),
                    (supabase.from('subjects') as any)
                        .select('id, title')
                        .eq('user_id', user.id)
                        .abortSignal(signal)
                ]);
                
                const docs = docsRes.data;
                const subjects = subjectsRes.data;
                
                const allContent = [
                    ...(docs || []).map((d: { id: string; title: string; content: string }) => ({ id: d.id, title: d.title, type: 'document', content: d.content.substring(0, 500) })),
                    ...(subjects || []).map((s: { id: string; title: string }) => ({ id: s.id, title: s.title, type: 'subject' }))
                ];

                const prompt = `User query: "${searchQuery}". 
                Find the most relevant items from this list: ${JSON.stringify(allContent.slice(0, 20))}.
                Return ONLY a JSON array of the IDs of the top 5 most relevant items.`;

                const aiResult = await dub5ai.streamRequest(prompt, { task: 'search' });
                try {
                    const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
                    const relevantIds = JSON.parse(cleanJson);
                    
                    const semanticResults: SearchResult[] = allContent
                        .filter(item => relevantIds.includes(item.id))
                        .map(item => ({
                            id: item.id,
                            type: item.type as any,
                            title: item.title,
                            subtitle: 'AI Match',
                            path: item.type === 'document' ? '/smart-notes' : `/subjects/${item.id}/chapters`
                        }));
                    
                    setResults(semanticResults);
                } catch (e) {
                    console.error('Semantic search parse error', e);
                }
            } else {
                // Regular keyword search
                const [notesRes, subjectsRes] = await Promise.all([
                    (supabase.from('smart_notes') as any)
                        .select('id, title')
                        .ilike('title', `%${searchQuery}%`)
                        .eq('user_id', user.id)
                        .limit(5)
                        .abortSignal(signal),
                    (supabase.from('subjects') as any)
                        .select('id, title')
                        .ilike('title', `%${searchQuery}%`)
                        .eq('user_id', user.id)
                        .limit(5)
                        .abortSignal(signal)
                ]);

                const keywordResults: SearchResult[] = [
                    ...(notesRes.data || []).map((d: { id: string; title: string }) => ({
                        id: d.id,
                        type: 'document' as const,
                        title: d.title,
                        subtitle: 'Document',
                        path: `/smart-notes?id=${d.id}`
                    })),
                    ...(subjectsRes.data || []).map((s: { id: string; title: string }) => ({
                        id: s.id,
                        type: 'subject' as const,
                        title: s.title,
                        subtitle: 'Subject',
                        path: `/subjects/${s.id}/chapters`
                    }))
                ];
                setResults(keywordResults);
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Debounced search
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            if (query.length > 1) {
                performSearch(query, isSemantic, controller.signal);
            } else {
                setResults([]);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, isSemantic, performSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // No global ref needed here since the effect above handles its own controller
        };
    }, []);

    const handleSelect = (result: SearchResult) => {
        router.push(result.path);
        setIsOpen(false);
    };

    const displayedResults = query === '' ? QUICK_ACTIONS : results;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (displayedResults.length + (query ? 1 : 0)));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + (displayedResults.length + (query ? 1 : 0))) % (displayedResults.length + (query ? 1 : 0)));
        } else if (e.key === 'Enter') {
            if (selectedIndex === displayedResults.length && query) {
                setIsSemantic(true);
            } else if (displayedResults[selectedIndex]) {
                handleSelect(displayedResults[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl glass-card overflow-hidden shadow-2xl border-white/10 flex flex-col animate-in zoom-in-95 duration-200"
                onKeyDown={handleKeyDown}
            >
                {/* Search Input Area */}
                <div className="flex items-center px-4 py-4 border-b border-white/10 bg-white/5">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search documents, subjects, or ask AI..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-slate-500"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                    />
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 text-[10px] text-slate-400 font-mono">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="ml-4 p-1 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                            <p className="text-sm">
                                {isSemantic ? 'AI is analyzing your knowledge base...' : 'Searching...'}
                            </p>
                        </div>
                    ) : displayedResults.length > 0 ? (
                        <div className="space-y-1">
                            {query === '' && (
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Quick Actions
                                </div>
                            )}
                            {displayedResults.map((result, idx) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left ${
                                        selectedIndex === idx 
                                            ? 'bg-blue-500/20 border border-blue-500/30' 
                                            : 'border border-transparent hover:bg-white/5'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        result.type === 'document' ? 'bg-blue-500/10 text-blue-400' :
                                        result.type === 'subject' ? 'bg-purple-500/10 text-purple-400' :
                                        result.type === 'action' ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-slate-800 text-slate-400'
                                    }`}>
                                        {result.type === 'document' ? <FileText className="w-5 h-5" /> :
                                         result.type === 'subject' ? <BookOpen className="w-5 h-5" /> :
                                         result.type === 'action' ? <Zap className="w-5 h-5" /> :
                                         <Layers className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white truncate">{result.title}</h4>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                                            {result.subtitle || result.type}
                                        </p>
                                    </div>
                                    {selectedIndex === idx && (
                                        <ArrowRight className="w-4 h-4 text-blue-400 animate-in slide-in-from-left-2" />
                                    )}
                                </button>
                            ))}

                            {!isSemantic && (
                                <button
                                    onClick={() => setIsSemantic(true)}
                                    onMouseEnter={() => setSelectedIndex(results.length)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border border-dashed ${
                                        selectedIndex === results.length 
                                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-300' 
                                            : 'border-white/10 text-slate-400 hover:text-slate-300'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold">Deep Semantic Search</h4>
                                        <p className="text-xs opacity-70">Let Dub5 AI find meaning across all your content</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    ) : query.length > 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p>No direct matches found.</p>
                            <button 
                                onClick={() => setIsSemantic(true)}
                                className="mt-4 text-purple-400 hover:text-purple-300 flex items-center gap-2 mx-auto font-bold"
                            >
                                <Zap className="w-4 h-4" />
                                Try Semantic Search with AI
                            </button>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                                    <div className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Navigation</div>
                                    <div className="space-y-2">
                                        <div className="text-sm text-slate-300 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Go to Dashboard
                                        </div>
                                        <div className="text-sm text-slate-300 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                            My Subjects
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                                    <div className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">Power Actions</div>
                                    <div className="space-y-2">
                                        <div className="text-sm text-slate-300 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-yellow-500" />
                                            Generate Quiz
                                        </div>
                                        <div className="text-sm text-slate-300 flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-purple-500" />
                                            Ask Dub5
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">ESC</span>
                            Close
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">↑↓</span>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10">ENTER</span>
                            Select
                        </span>
                    </div>
                    <div className="text-blue-500">
                        Dub5 Semantic Search
                    </div>
                </div>
            </div>
        </div>
    );
}
