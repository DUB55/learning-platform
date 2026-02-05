'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { xpService } from '@/lib/xpService';

interface XPProgressBarProps {
    currentXp: number;
    level: number;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function XPProgressBar({ 
    currentXp, 
    level, 
    showDetails = true,
    size = 'md'
}: XPProgressBarProps) {
    // Calculate progress correctly within the current level
    const xpForCurrentStart = level > 1 ? xpService.xpForNextLevel(level - 1) : 0;
    const xpForNextStart = xpService.xpForNextLevel(level);
    const range = xpForNextStart - xpForCurrentStart;
    const earnedInLevel = currentXp - xpForCurrentStart;
    const progress = Math.min(100, Math.max(0, (earnedInLevel / range) * 100));
    
    const heightMap = {
        sm: 'h-1.5',
        md: 'h-3',
        lg: 'h-5'
    };

    return (
        <div className="w-full space-y-2">
            {showDetails && (
                <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Level</span>
                        <span className="text-2xl font-black text-white leading-none">Lvl {level}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progress</span>
                        <span className="text-sm font-bold text-blue-400 leading-none">
                            {currentXp.toLocaleString()} / {xpForNextStart.toLocaleString()} XP
                        </span>
                    </div>
                </div>
            )}
            
            <div className={`w-full bg-slate-800/50 backdrop-blur-sm rounded-full ${heightMap[size]} overflow-hidden border border-white/5 p-0.5`}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />
            </div>
            
            {showDetails && (
                <p className="text-[10px] text-slate-500 font-medium text-center italic">
                    {xpForNextLevel - currentXp} XP remaining until level {level + 1}
                </p>
            )}
        </div>
    );
}
