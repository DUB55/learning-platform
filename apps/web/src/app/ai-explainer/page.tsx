'use client';

import { useState, useEffect } from 'react';
import { 
    Video, 
    Sparkles, 
    Brain, 
    Play, 
    Upload, 
    Wand2, 
    Settings2, 
    MessageSquare, 
    Layers, 
    Type, 
    Languages, 
    History, 
    Save, 
    Trash2, 
    CheckCircle2, 
    Download, 
    X
} from 'lucide-react';
import ErrorLogger from '@/lib/ErrorLogger';
import { apiFetch } from '@/lib/api';

export default function AIExplainerPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [content, setContent] = useState('');
    const [style, setStyle] = useState('Animated 2D');
    const [voice, setVoice] = useState('Natural Male');
    const [length, setLength] = useState(2);
    const [explainerResult, setExplainerResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [availableNotes, setAvailableNotes] = useState<any[]>([]);

    // Load history and last result on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('ai_explainer_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to load history', e);
            }
        }

        const lastResult = localStorage.getItem('ai_explainer_last_result');
        if (lastResult) {
            try {
                setExplainerResult(JSON.parse(lastResult));
            } catch (e) {
                console.error('Failed to load last result', e);
            }
        }

        // Load available notes for picking
        const savedNotes = localStorage.getItem('smart_notes_v2');
        if (savedNotes) {
            try {
                setAvailableNotes(JSON.parse(savedNotes));
            } catch (e) {
                console.error('Failed to load notes', e);
            }
        }
    }, []);

    const pickNote = (note: any) => {
        // Strip HTML tags for the prompt
        const cleanContent = note.content.replace(/<[^>]*>?/gm, '');
        setContent(cleanContent);
        setShowNotesModal(false);
    };

    const saveToHistory = (data: any) => {
        const newItem = {
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toLocaleString(),
            duration: `~${length} min`,
            style: style
        };
        const newHistory = [newItem, ...history];
        setHistory(newHistory);
        localStorage.setItem('ai_explainer_history', JSON.stringify(newHistory));
    };

    const handleGenerate = async () => {
        if (!content.trim()) return;
        setIsGenerating(true);
        try {
            const result = await apiFetch('/api/generate-explainer', {
                method: 'POST',
                body: JSON.stringify({ content, style, voice, length }),
            });
            
            if (result.success) {
                setExplainerResult(result.data);
                localStorage.setItem('ai_explainer_last_result', JSON.stringify(result.data));
                saveToHistory(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            ErrorLogger.error('Failed to generate explainer', err);
            alert(`Failed to generate explainer: ${err.message || 'Check if the backend API is running.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const loadFromHistory = (item: any) => {
        setExplainerResult(item);
        setActiveTab('create');
        localStorage.setItem('ai_explainer_last_result', JSON.stringify(item));
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newHistory = history.filter(item => item.id !== id);
        setHistory(newHistory);
        localStorage.setItem('ai_explainer_history', JSON.stringify(newHistory));
    };

    const saveToLibrary = () => {
        if (!explainerResult) return;
        
        const libraryItems = JSON.parse(localStorage.getItem('user_library') || '[]');
        const newItem = {
            id: Date.now().toString(),
            type: 'explainer',
            title: explainerResult.title,
            content: explainerResult,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('user_library', JSON.stringify([...libraryItems, newItem]));
        alert('Saved to your Library!');
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
                            <Video className="w-8 h-8 text-blue-400" />
                            AI Explainer
                        </h1>
                        <p className="text-slate-400 mt-2">Generate engaging educational videos from your notes or topics using AI.</p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button 
                            onClick={() => setActiveTab('create')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'create' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Create
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {activeTab === 'create' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Side */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Input Content
                                    </label>
                                    <textarea 
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Paste your notes, a transcript, or describe the topic you want to explain..."
                                        className="w-full h-48 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => alert('Upload PDF/Doc coming soon!')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs transition-colors"
                                        >
                                            <Upload className="w-3 h-3" />
                                            Upload PDF/Doc
                                        </button>
                                        <button 
                                            onClick={() => setShowNotesModal(true)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-xs transition-colors"
                                        >
                                            <Brain className="w-3 h-3" />
                                            Pick from Notes
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Settings2 className="w-4 h-4" />
                                        Video Settings
                                    </label>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Video Length</span>
                                            <span className="text-blue-400">~{length} minutes</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="10" 
                                            value={length}
                                            onChange={(e) => setLength(parseInt(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase">Style</label>
                                            <select 
                                                value={style}
                                                onChange={(e) => setStyle(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs"
                                            >
                                                <option>Animated 2D</option>
                                                <option>Realistic 3D</option>
                                                <option>Whiteboard</option>
                                                <option>Cinematic</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase">Voice</label>
                                            <select 
                                                value={voice}
                                                onChange={(e) => setVoice(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs"
                                            >
                                                <option>Natural Male</option>
                                                <option>Natural Female</option>
                                                <option>Enthusiastic</option>
                                                <option>Academic</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                        <Languages className="w-4 h-4 text-blue-400" />
                                        <div className="flex-1">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Language</div>
                                            <div className="text-xs">Dutch (Nederlands)</div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !content.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Sparkles className="w-5 h-5 animate-pulse" />
                                            Generating Video...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            Generate Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Preview Side */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="aspect-video bg-slate-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                                    {explainerResult ? (
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black cursor-pointer hover:scale-110 transition-transform">
                                                <Play className="w-6 h-6 fill-current" />
                                            </div>
                                            <div className="flex-1 h-1 bg-white/20 rounded-full relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1/3 h-full bg-blue-500" />
                                            </div>
                                            <span className="text-xs font-mono">01:24 / 02:00</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest w-full text-center">
                                            Preview not available
                                        </div>
                                    )}
                                </div>

                                {isGenerating ? (
                                    <div className="text-center space-y-4">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                                            <Sparkles className="w-8 h-8 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">AI is composing your video...</p>
                                            <p className="text-sm text-slate-400">Estimated time: 45 seconds</p>
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[10px] text-blue-400 border border-blue-500/20">Analyzing Script</div>
                                            <div className="px-3 py-1 bg-purple-500/10 rounded-full text-[10px] text-purple-400 border border-purple-500/20">Generating Visuals</div>
                                            <div className="px-3 py-1 bg-slate-500/10 rounded-full text-[10px] text-slate-400 border border-white/5">Voice Synthesis</div>
                                        </div>
                                    </div>
                                ) : explainerResult ? (
                                    <div className="p-8 w-full h-full overflow-y-auto space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-bold text-blue-400">{explainerResult.title}</h2>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={saveToLibrary}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-600/30 transition-all"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                    Save to Library
                                                </button>
                                                <div className="px-3 py-1.5 bg-green-500/10 rounded-lg text-[10px] text-green-400 border border-green-500/20 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Ready for Production
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Voiceover Script</h3>
                                                <p className="text-sm text-slate-300 leading-relaxed">{explainerResult.script}</p>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase">Visual Storyboard</h3>
                                                <div className="space-y-2">
                                                    {explainerResult.scenes?.map((scene: any, idx: number) => (
                                                        <div key={idx} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/5 items-start">
                                                            <div className="text-[10px] font-mono text-blue-500 pt-1">{scene.time}</div>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold text-slate-300 mb-1">Visual: {scene.visual}</div>
                                                                <div className="text-[11px] text-slate-500 italic">&quot;{scene.text}&quot;</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10">
                                            <Video className="w-10 h-10 text-slate-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-400 text-sm">No video generated yet.</p>
                                            <p className="text-slate-500 text-xs">Your video preview will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Features Showcase */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <FeatureCard icon={Layers} title="Multi-Scene" description="Dynamic scene switching" />
                                <FeatureCard icon={Type} title="Subtitles" description="Auto-generated captions" />
                                <FeatureCard icon={Sparkles} title="Effects" description="Cinematic transitions" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Video Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <History className="w-10 h-10 opacity-20" />
                                                <p className="text-sm font-medium">No video history found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item, i) => (
                                        <tr 
                                            key={i} 
                                            onClick={() => loadFromHistory(item)}
                                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                                                        <Video className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{item.title}</div>
                                                        <div className="text-[10px] text-slate-500">{item.style} • Dutch</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">{item.duration}</td>
                                            <td className="px-6 py-4 text-sm text-slate-400">{item.createdAt}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-blue-400"
                                                        title="Load Explainer"
                                                    >
                                                        <Play className="w-4 h-4 fill-current" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => deleteHistoryItem(item.id, e)}
                                                        className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg transition-colors text-slate-500 hover:text-red-400"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pick Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-400" />
                                Pick from your Notes
                            </h3>
                            <button 
                                onClick={() => setShowNotesModal(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                            {availableNotes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <p>No notes found in your library.</p>
                                    <p className="text-xs">Go to Smart Notes to create some!</p>
                                </div>
                            ) : (
                                availableNotes.map((note) => (
                                    <button 
                                        key={note.id}
                                        onClick={() => pickNote(note)}
                                        className="w-full text-left p-4 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{note.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">Last updated: {new Date(note.updatedAt).toLocaleDateString()}</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-all" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                            <button 
                                onClick={() => setShowNotesModal(false)}
                                className="px-6 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
        </svg>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2 hover:bg-white/10 transition-colors cursor-default">
            <Icon className="w-5 h-5 text-blue-400" />
            <div className="text-xs font-bold">{title}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{description}</div>
        </div>
    );
}
