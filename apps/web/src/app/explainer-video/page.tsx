'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Video, Sparkles, Upload, Type, ArrowLeft, 
    ChevronRight, Wand2, BookOpen, Clock, Play, Layout
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ExplainerPlayer } from './components/ExplainerPlayer';
import { ExplainerScript } from './types';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';

export default function ExplainerVideoPage() {
    const router = useRouter();
    const [mode, setMode] = useState<'subject' | 'upload'>('subject');
    const [input, setInput] = useState('');
    const [material, setMaterial] = useState('');
    const [duration, setDuration] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedScript, setGeneratedScript] = useState<ExplainerScript | null>(null);

    const handleGenerate = async () => {
        if (!input && mode === 'subject') return;
        if (!material && mode === 'upload') return;
        
        setIsGenerating(true);
        try {
            const script = await dub5ai.generateExplainerScript(
                mode === 'subject' ? input : "Gegenereerd op basis van materiaal", 
                duration,
                mode === 'upload' ? material : undefined
            );
            setGeneratedScript(script);
        } catch (error) {
            ErrorLogger.error('Generation failed', error);
            // Fallback to a minimal script if generation fails
            setGeneratedScript({
                title: input || "Fout bij genereren",
                duration: 60,
                segments: [{
                    startTime: 0,
                    endTime: 60,
                    text: "Er is een fout opgetreden bij het genereren van het script. Probeer het later opnieuw.",
                    visualAction: 'show_slide',
                    visualData: { title: "Fout", content: ["Generatie mislukt"] }
                }]
            });
        } finally {
            setIsGenerating(false);
        }
    };

    if (generatedScript) {
        return (
            <ExplainerPlayer 
                script={generatedScript} 
                onClose={() => setGeneratedScript(null)} 
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-2"
                    >
                        <Video className="w-10 h-10 text-blue-400" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tight italic uppercase">Imagine Explainers</h1>
                    <p className="text-slate-400 max-w-xl">
                        Zet je studiemateriaal om in een boeiende educatieve video van 10 tot 60 minuten.
                    </p>
                </div>

                {/* Main Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Input */}
                    <div className="space-y-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md">
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                            <button 
                                onClick={() => setMode('subject')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${mode === 'subject' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Type className="w-4 h-4 mx-auto mb-1" />
                                ONDERWERP
                            </button>
                            <button 
                                onClick={() => setMode('upload')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${mode === 'upload' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Upload className="w-4 h-4 mx-auto mb-1" />
                                MATERIAAL
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] px-2">
                                {mode === 'subject' ? 'Wat wil je leren?' : 'Upload je bestanden'}
                            </label>
                            {mode === 'subject' ? (
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Bijv: De werking van fotosynthese in plantencellen..."
                                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                />
                            ) : (
                                <div className="space-y-4">
                                    <textarea 
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        placeholder="Plak hier je notities, artikel of tekst die je wilt laten uitleggen..."
                                        className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                    />
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <Sparkles className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-bold text-blue-300 uppercase">Tip: Hoe meer tekst, hoe beter de uitleg</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Settings */}
                    <div className="space-y-6 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Videoduur (Minuten)
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[10, 30, 60].map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setDuration(m)}
                                            className={`py-4 rounded-2xl font-black text-sm transition-all border ${duration === m ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-white/5 text-slate-400 hover:text-white'}`}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    AI Kenmerken
                                </label>
                                <div className="space-y-3">
                                    <FeatureItem icon={<Wand2 className="w-3 h-3" />} label="Automatisch Transcript" />
                                    <FeatureItem icon={<BookOpen className="w-3 h-3" />} label="Structurele Outline" />
                                    <FeatureItem icon={<Layout className="w-3 h-3" />} label="Dynamic Slide Generation" />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || (mode === 'subject' ? !input : !material)}
                            className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isGenerating ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 active:scale-[0.98]'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    GENEREREN...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    GENEREER VIDEO
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="text-slate-500 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        TERUG NAAR DASHBOARD
                    </button>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Powered by dub5 AI
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5">
            <div className="text-blue-400">{icon}</div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{label}</span>
        </div>
    );
}
