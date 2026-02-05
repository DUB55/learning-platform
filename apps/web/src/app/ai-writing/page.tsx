'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    PenTool, 
    Sparkles, 
    Type, 
    AlignLeft, 
    CheckCircle2, 
    Copy, 
    RotateCcw, 
    Wand2,
    FileText,
    Languages,
    Mic,
    Shield,
    User,
    Lock
} from 'lucide-react';
import { processWriting } from '@/app/actions/aiWriting';
import ErrorLogger from '@/lib/ErrorLogger';

type WritingMode = 
    | 'improve' 
    | 'summarize' 
    | 'expand' 
    | 'fix_grammar' 
    | 'tone_academic' 
    | 'tone_simple' 
    | 'brainstorm'
    | 'plagiarism_check'
    | 'remove_ai_style'
    | 'ai_detector'
    | 'remove_watermarks';

const modes = [
    { id: 'improve', label: 'Improve Writing', icon: <Sparkles className="w-4 h-4" />, description: 'Make it sound better and more professional.' },
    { id: 'fix_grammar', label: 'Fix Grammar', icon: <CheckCircle2 className="w-4 h-4" />, description: 'Correct spelling and punctuation errors.' },
    { id: 'remove_ai_style', label: 'Humanize (Undetectable AI)', icon: <User className="w-4 h-4" />, description: 'Remove AI writing style and make it undetectable.', featured: true },
    { id: 'ai_detector', label: 'AI Detector', icon: <Shield className="w-4 h-4" />, description: 'Check if text was written by AI or Human.', featured: true },
    { id: 'plagiarism_check', label: 'Plagiarism Checker', icon: <FileText className="w-4 h-4" />, description: 'Check for plagiarism and remove it.', featured: true },
    { id: 'remove_watermarks', label: 'Remove AI Watermarks', icon: <Lock className="w-4 h-4" />, description: 'Remove hidden AI watermarks and characters.', featured: true },
    { id: 'summarize', label: 'Summarize', icon: <AlignLeft className="w-4 h-4" />, description: 'Condense long text into key points.' },
    { id: 'expand', label: 'Expand', icon: <Type className="w-4 h-4" />, description: 'Add more detail and depth to your points.' },
    { id: 'tone_academic', label: 'Academic Tone', icon: <FileText className="w-4 h-4" />, description: 'Make it sound formal for essays and papers.' },
    { id: 'tone_simple', label: 'Simplify', icon: <Languages className="w-4 h-4" />, description: 'Explain it like I\'m five.' },
    { id: 'brainstorm', label: 'Brainstorm', icon: <Wand2 className="w-4 h-4" />, description: 'Generate ideas based on your prompt.' },
];

export default function AIWritingPage() {
    const { user, updateXP } = useAuth();
    const router = useRouter();
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<WritingMode>('improve');
    const [aiDetection, setAiDetection] = useState<{ ai: number; human: number } | null>(null);

    const handleProcess = async () => {
        if (!input.trim() || loading) return;
        setLoading(true);
        setAiDetection(null);

        try {
            const res = await processWriting(input, mode);

            if (res.success) {
                if (mode === 'ai_detector' && res.metadata?.aiDetection) {
                    setAiDetection(res.metadata.aiDetection);
                }
                setResult(res.text || '');
                
                if (user) {
                    await updateXP(20, `Used AI Writing Assistant: ${mode.replace('_', ' ')}`);
                }
            } else {
                throw new Error(res.error || 'Failed to process text');
            }
        } catch (error) {
            ErrorLogger.error('AI Writing processing failed', error);
            alert('Processing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        alert('Copied to clipboard!');
    };

    return (
        <div className="h-full p-8 max-w-6xl mx-auto">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-blue-400" />
                        AI Writing
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Options Sidebar */}
                <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Select Mode</h2>
                    {modes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setMode(m.id as WritingMode);
                            }}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative ${
                                mode === m.id 
                                ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                                : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10'
                            }`}
                        >
                            {m.featured && (
                                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-tighter rounded-md border border-blue-500/20">
                                    Featured
                                </span>
                            )}
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`${mode === m.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                                    {m.icon}
                                </div>
                                <span className={`font-bold ${mode === m.id ? 'text-white' : 'text-slate-300'}`}>
                                    {m.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed">
                                {m.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 flex flex-col min-h-[500px]">
                        <div className="flex-1 flex flex-col space-y-4">
                            <div className="relative flex-1 flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                                    <span>Input Text</span>
                                    <span>{input.length} characters</span>
                                </label>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Paste your text here or start typing..."
                                    className="flex-1 w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-sans leading-relaxed"
                                />
                            </div>

                            {result && (
                                <div className="relative flex-1 flex flex-col mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <label className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                                        <span>AI Result</span>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                    </label>

                                    {aiDetection && (
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Human Score</div>
                                                <div className="text-2xl font-bold text-emerald-400">{aiDetection.human}%</div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                    <div 
                                                        className="bg-emerald-500 h-full transition-all duration-1000" 
                                                        style={{ width: `${aiDetection.human}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4">
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">AI Score</div>
                                                <div className="text-2xl font-bold text-red-400">{aiDetection.ai}%</div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                    <div 
                                                        className="bg-red-500 h-full transition-all duration-1000" 
                                                        style={{ width: `${aiDetection.ai}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1 w-full bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-slate-200 font-sans leading-relaxed whitespace-pre-wrap overflow-auto">
                                        {result}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                            <button
                                onClick={() => { setInput(''); setResult(''); }}
                                className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm px-4 py-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Clear
                            </button>
                            
                            <button
                                onClick={handleProcess}
                                disabled={!input.trim() || loading}
                                className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                                    !input.trim() || loading
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        Enhance Text
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Languages className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Multi-Language</h3>
                                <p className="text-xs text-slate-500">Supports over 50 languages</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Voice Support</h3>
                                <p className="text-xs text-slate-500">Coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}