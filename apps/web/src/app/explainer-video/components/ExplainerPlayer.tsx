'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, Layout, Video, ChevronRight, ChevronLeft, Sparkles, Quote, BookOpen } from 'lucide-react';
import { ExplainerScript, ExplainerSegment } from '../types';

interface ExplainerPlayerProps {
    script: ExplainerScript;
    onClose: () => void;
}

export function ExplainerPlayer({ script, onClose }: ExplainerPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    useEffect(() => {
        synthesisRef.current = window.speechSynthesis;
        return () => {
            synthesisRef.current?.cancel();
        };
    }, []);

    const playSegment = (index: number) => {
        if (!synthesisRef.current || index >= script.segments.length || index < 0) {
            setIsPlaying(false);
            return;
        }

        synthesisRef.current.cancel();

        const segment = script.segments[index];
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = 'nl-NL';
        utterance.rate = 1.0;
        
        utterance.onstart = () => {
            setCurrentSegmentIndex(index);
            setIsPlaying(true);
        };

        utterance.onend = () => {
            if (index + 1 < script.segments.length) {
                playSegment(index + 1);
            } else {
                setIsPlaying(false);
            }
        };

        utteranceRef.current = utterance;
        synthesisRef.current.speak(utterance);
    };

    const togglePlay = () => {
        if (isPlaying) {
            synthesisRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (synthesisRef.current?.paused) {
                synthesisRef.current.resume();
                setIsPlaying(true);
            } else {
                playSegment(currentSegmentIndex);
            }
        }
    };

    const nextSegment = () => {
        if (currentSegmentIndex < script.segments.length - 1) {
            playSegment(currentSegmentIndex + 1);
        }
    };

    const prevSegment = () => {
        if (currentSegmentIndex > 0) {
            playSegment(currentSegmentIndex - 1);
        }
    };

    const currentSegment = script.segments[currentSegmentIndex];

    return (
        <div className="fixed inset-0 bg-[#0a0f1e] z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Video className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-tighter italic">AI Explainer</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{script.title}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10"
                >
                    Sluiten
                </button>
            </header>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
                {/* Navigation Arrows */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
                    <button 
                        onClick={prevSegment}
                        disabled={currentSegmentIndex === 0}
                        className="p-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-full border border-white/10 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
                    <button 
                        onClick={nextSegment}
                        disabled={currentSegmentIndex === script.segments.length - 1}
                        className="p-4 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-full border border-white/10 transition-all"
                    >
                        <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentSegmentIndex}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.05 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="max-w-4xl w-full aspect-video bg-[#1e293b]/50 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative group"
                    >
                        {/* Slide Content */}
                        <div className="flex-1 p-16 flex flex-col justify-center">
                            {currentSegment.visualAction === 'show_slide' && (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase leading-none">
                                        {currentSegment.visualData.title}
                                    </h1>
                                    <div className="h-1.5 w-24 bg-blue-500 rounded-full" />
                                    <p className="text-2xl text-slate-300 font-medium leading-relaxed">
                                        {currentSegment.visualData.content?.[0]}
                                    </p>
                                </motion.div>
                            )}

                            {currentSegment.visualAction === 'show_bullet' && (
                                <div className="space-y-12">
                                    <h2 className="text-3xl font-black text-blue-400 uppercase tracking-tight">
                                        {currentSegment.visualData.title}
                                    </h2>
                                    <ul className="space-y-6">
                                        {currentSegment.visualData.content?.map((bullet, i) => (
                                            <motion.li 
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.2 }}
                                                className="flex items-center gap-4 text-2xl text-white font-bold"
                                            >
                                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                                {bullet}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {currentSegment.visualAction === 'show_quote' && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative p-12 bg-white/5 rounded-[2rem] border border-white/10"
                                >
                                    <Quote className="absolute -top-6 -left-6 w-20 h-20 text-blue-500/20" />
                                    <p className="text-3xl font-bold text-white italic text-center leading-relaxed">
                                        "{currentSegment.visualData.highlight || currentSegment.text}"
                                    </p>
                                    {currentSegment.visualData.author && (
                                        <p className="mt-8 text-right text-blue-400 font-black uppercase tracking-widest text-sm">
                                            — {currentSegment.visualData.author}
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {currentSegment.visualAction === 'show_definition' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/20 rounded-2xl">
                                            <BookOpen className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                                            {currentSegment.visualData.term}
                                        </h2>
                                    </div>
                                    <div className="p-8 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                                        <p className="text-2xl text-slate-200 font-medium leading-relaxed">
                                            {currentSegment.visualData.definition}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {currentSegment.visualAction === 'show_image' && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center"
                                >
                                    {currentSegment.visualData.imageUrl ? (
                                        <img 
                                            src={currentSegment.visualData.imageUrl} 
                                            alt={currentSegment.visualData.title || "Visual"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                            <Layout className="w-16 h-16 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Visual Placeholder</p>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                                        <h3 className="text-2xl font-black text-white uppercase italic">
                                            {currentSegment.visualData.title}
                                        </h3>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Transcript Overlay (Subtitles) */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-center text-lg font-medium text-slate-200 px-12">
                                {currentSegment.text}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="h-32 px-12 bg-black/40 border-t border-white/10 flex flex-col justify-center gap-4">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSegmentIndex + 1) / script.segments.length) * 100}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={prevSegment}
                                disabled={currentSegmentIndex === 0}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={togglePlay}
                                className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <button 
                                onClick={nextSegment}
                                disabled={currentSegmentIndex === script.segments.length - 1}
                                className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <button 
                            onClick={() => {
                                synthesisRef.current?.cancel();
                                playSegment(0);
                            }}
                            className="p-3 text-slate-400 hover:text-white transition-colors"
                            title="Herstarten"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xs font-mono text-blue-400">
                                Segment {currentSegmentIndex + 1} / {script.segments.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Volume2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Dutch Voice</span>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Narrator</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
