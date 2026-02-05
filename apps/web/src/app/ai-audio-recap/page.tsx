
'use client';

import { useState, useEffect } from 'react';
import { Headphones, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2, History, Loader2, Save, FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ErrorLogger from '@/lib/ErrorLogger';
import { apiFetch } from '@/lib/api';

export default function AiAudioRecapPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [subject, setSubject] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedScript, setGeneratedScript] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [savedRecaps, setSavedRecaps] = useState<any[]>([]);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const saved = localStorage.getItem('ai_audio_recap_library');
        if (saved) {
            try {
                setSavedRecaps(JSON.parse(saved));
            } catch (e) {
                ErrorLogger.error('Failed to parse saved recaps', e);
            }
        }
    }, []);

    // Estimate duration based on word count (avg 150 words per minute)
    useEffect(() => {
        if (generatedScript) {
            const words = generatedScript.split(/\s+/).length;
            setDuration(Math.ceil((words / 150) * 60));
        }
    }, [generatedScript]);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleGenerate = async () => {
        if (!subject.trim()) return;

        setIsGenerating(true);
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentTime(0);

        try {
            const result = await apiFetch('/api/generate-audio-script', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.id}`
                },
                body: JSON.stringify({ subject, userId: user?.id }),
            });
            
            if (result.success) {
                setGeneratedScript(result.script);
                
                // Initialize Web Speech API Utterance
                const newUtterance = new SpeechSynthesisUtterance(result.script);
                
                // Find a good voice (preferably a natural sounding one)
                const voices = window.speechSynthesis.getVoices();
                const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
                if (preferredVoice) newUtterance.voice = preferredVoice;
                
                newUtterance.rate = 1.0;
                newUtterance.pitch = 1.0;

                newUtterance.onboundary = (event) => {
                    if (event.name === 'word') {
                        // Approximate progress
                        const charIndex = event.charIndex;
                        const totalChars = result.script.length;
                        setCurrentTime(Math.floor((charIndex / totalChars) * duration));
                    }
                };

                newUtterance.onend = () => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                };

                setUtterance(newUtterance);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            ErrorLogger.error('Generation failed', err);
            alert(`Generation failed: ${err.message || 'Please ensure the backend API is running.'}`);
            setGeneratedScript(null);
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlay = () => {
        if (!utterance) return;

        if (isPlaying) {
            window.speechSynthesis.pause();
            setIsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.speak(utterance);
            }
            setIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const saveRecap = () => {
        if (!generatedScript) return;

        const newRecap = {
            id: Date.now().toString(),
            subject,
            date: new Date().toISOString(),
            script: generatedScript,
            duration: duration
        };

        const updated = [newRecap, ...savedRecaps];
        setSavedRecaps(updated);
        localStorage.setItem('ai_audio_recap_library', JSON.stringify(updated));
        alert('Recap saved successfully!');
    };

    const loadRecap = (recap: any) => {
        setSubject(recap.subject);
        setGeneratedScript(recap.script);
        setDuration(recap.duration);
        window.speechSynthesis.cancel();
        
        const newUtterance = new SpeechSynthesisUtterance(recap.script);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
        if (preferredVoice) newUtterance.voice = preferredVoice;
        
        newUtterance.onend = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        
        setUtterance(newUtterance);
        setIsPlaying(false);
        setCurrentTime(0);
    };

    if (authLoading) return null;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-10 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400 flex items-center gap-3">
                        <Headphones className="w-8 h-8 text-green-400" />
                        AI Audio Recap
                    </h1>
                </div>
                <p className="text-slate-400">Convert your study materials or any subject into a high-quality audio recap for on-the-go learning.</p>
            </header>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Generator Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="space-y-4 relative z-10">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">What do you want to recap?</label>
                            <textarea
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Paste your notes, a subject name, or a specific topic..."
                                className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            />
                        </div>

                        <div className="flex justify-end relative z-10">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !subject.trim()}
                                className="glass-button px-8 py-3 rounded-xl flex items-center gap-2 text-white font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Audio...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Recap
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Playback Section */}
                    {generatedScript && (
                        <div className="glass-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Headphones className="w-16 h-16 text-white" />
                                </div>
                                
                                <div className="flex-1 space-y-4 w-full">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{subject}</h3>
                                        <p className="text-slate-400 text-sm">AI-Generated Study Audio</p>
                                    </div>

                                    {/* Web Speech Progress */}
                                    <div className="space-y-2">
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                                                style={{ width: `${(currentTime / duration) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={() => {
                                                    window.speechSynthesis.cancel();
                                                    setIsPlaying(false);
                                                    setCurrentTime(0);
                                                }}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <SkipBack className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={togglePlay}
                                                className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-110 transition-transform"
                                            >
                                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                            </button>
                                            <button className="text-slate-400 hover:text-white transition-colors opacity-50 cursor-not-allowed">
                                                <SkipForward className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={saveRecap}
                                                className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                                title="Save to Library"
                                            >
                                                <Save className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Script Preview */}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-4 text-slate-400">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Generated Script</span>
                                </div>
                                <div className="bg-slate-900/30 rounded-xl p-4 text-slate-300 text-sm leading-relaxed max-h-40 overflow-y-auto italic">
                                    "{generatedScript}"
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Recaps Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-400" />
                        Library
                    </h2>

                    <div className="space-y-3">
                        {savedRecaps.length === 0 ? (
                            <div className="glass-card p-8 text-center border-dashed">
                                <p className="text-slate-500 text-sm">Your library is empty.</p>
                            </div>
                        ) : (
                            savedRecaps.map((recap) => (
                                <div 
                                    key={recap.id} 
                                    onClick={() => loadRecap(recap)}
                                    className="glass-card p-4 hover:bg-white/5 transition-all group cursor-pointer border-white/5"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-white font-medium group-hover:text-purple-400 transition-colors truncate pr-2">{recap.subject}</h3>
                                        <Play className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>{new Date(recap.date).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">
                                            <Volume2 className="w-3 h-3" />
                                            {formatTime(recap.duration)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

