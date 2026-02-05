'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import * as Icons from 'lucide-react';

interface AchievementCardProps {
    name: string;
    description: string;
    icon: string;
    xpReward: number;
    isUnlocked: boolean;
    unlockedAt?: string;
    category: string;
    requirementType?: string;
    requirementValue?: number;
    currentValue?: number;
}

export default function AchievementCard({
    name,
    description,
    icon,
    xpReward,
    isUnlocked,
    unlockedAt,
    category,
    requirementType,
    requirementValue,
    currentValue = 0
}: AchievementCardProps) {
    // Dynamically get the icon component
    const IconComponent = (Icons as any)[icon] || Trophy;

    const progress = requirementValue ? Math.min(100, (currentValue / requirementValue) * 100) : 0;

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isUnlocked 
                ? 'bg-[#0f172a]/80 border-blue-500/30 shadow-lg shadow-blue-500/10' 
                : 'bg-slate-900/40 border-white/5 grayscale opacity-70'
            }`}
        >
            {/* Background Glow */}
            {isUnlocked && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
            )}

            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
                        <IconComponent size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {isUnlocked ? 'Unlocked' : 'Locked'}
                        </div>
                        <span className="text-xs font-bold text-blue-400 mt-2">+{xpReward} XP</span>
                    </div>
                </div>

                <h3 className={`text-base font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{description}</p>

                {/* Progress for locked achievements with requirements */}
                {!isUnlocked && requirementValue && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-slate-400">{currentValue} / {requirementValue}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div 
                                className="h-full bg-slate-600 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {isUnlocked && unlockedAt && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-medium">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        Unlocked {new Date(unlockedAt).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Status Overlay for Locked */}
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 pointer-events-none">
                    <Lock size={40} className="text-white/5 opacity-20" />
                </div>
            )}
        </motion.div>
    );
}
