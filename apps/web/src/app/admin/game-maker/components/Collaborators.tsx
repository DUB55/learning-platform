import React from 'react';
import { Collaborator } from '../hooks/useMultiplayer';
import { motion, AnimatePresence } from 'framer-motion';

export function Collaborators({ collaborators }: { collaborators: Collaborator[] }) {
    return (
        <div className="flex -space-x-2 overflow-hidden">
            <AnimatePresence>
                {collaborators.map((collab) => (
                    <motion.div
                        key={collab.id}
                        initial={{ opacity: 0, scale: 0.5, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: 20 }}
                        className="relative group"
                    >
                        <div 
                            className="w-8 h-8 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold text-white shadow-lg cursor-help"
                            style={{ backgroundColor: collab.color }}
                        >
                            {collab.name.substring(0, 2).toUpperCase()}
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-xl">
                            <div className="font-bold mb-1">{collab.name}</div>
                            {collab.activity && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <div className={`w-1 h-1 rounded-full ${collab.activity === 'idle' ? 'bg-slate-500' : 'bg-blue-400 animate-pulse'}`} />
                                    <span className="capitalize">{collab.activity}</span>
                                </div>
                            )}
                            {collab.selection && (
                                <div className="text-blue-400 font-bold mt-1">Editing: {collab.selection}</div>
                            )}
                        </div>

                        {/* Status Indicator */}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0f172a] rounded-full" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
