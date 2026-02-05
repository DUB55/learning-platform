'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Wand2, Clock, FileText, Send } from 'lucide-react';
import { dub5ai } from '@/lib/dub5ai';
import ErrorLogger from '@/lib/ErrorLogger';
import { GameDesign, GameObject } from '../types';

interface Magic3DModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (scene: any) => void;
}

export function Magic3DModal({ isOpen, onClose, onGenerated }: Magic3DModalProps) {
    const [command, setCommand] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleExecute = async () => {
        if (!command.trim()) return;
        
        setIsGenerating(true);
        try {
            const result = await dub5ai.executeMagicCommand(command);
            onGenerated(result);
            setCommand('');
            onClose();
        } catch (error) {
            ErrorLogger.error('Failed to execute magic command', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl">
                                        <Sparkles className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">AI Magic Input</h2>
                                        <p className="text-slate-400 text-sm">Zeg tegen de AI wat hij moet doen</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition-opacity" />
                                    <textarea 
                                        value={command}
                                        onChange={(e) => setCommand(e.target.value)}
                                        placeholder="Bijv: 'plaats een auto', 'zet 3 kubussen neer', 'maak het nacht'..."
                                        rows={3}
                                        className="relative w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleExecute();
                                            }
                                        }}
                                    />
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {['Plaats een auto', 'Maak het nacht', 'Zet 3 kubussen neer', 'Verander grond in sneeuw'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setCommand(suggestion)}
                                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleExecute}
                                disabled={isGenerating || !command.trim()}
                                className="w-full group relative py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-white transition-all shadow-xl shadow-purple-500/20 overflow-hidden"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>AI voert commando uit...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            <span>Uitvoeren</span>
                                        </>
                                    )}
                                </div>
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                    animate={isGenerating ? { x: ['-100%', '100%'] } : { x: '-100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
