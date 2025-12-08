'use client';

import { useState } from 'react';
import { Flame, Zap, Check } from 'lucide-react';

interface StreakRewardSelectorProps {
    onSelect: (choice: 'freeze' | 'xp') => void;
}

export default function StreakRewardSelector({ onSelect }: StreakRewardSelectorProps) {
    const [selected, setSelected] = useState<'freeze' | 'xp' | null>(null);

    const handleSelect = (choice: 'freeze' | 'xp') => {
        setSelected(choice);
        onSelect(choice);
    };

    return (
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/10 text-center animate-in zoom-in duration-300">
            <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Streak Milestone Reached!</h2>
                <p className="text-slate-400">Choose your reward for keeping the streak alive.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => handleSelect('freeze')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${selected === 'freeze'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-blue-400 hover:bg-white/5'
                        }`}
                >
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Streak Freeze</h3>
                        <p className="text-xs text-slate-400 mt-1">Protect your streak for 1 missed day</p>
                    </div>
                    {selected === 'freeze' && <Check className="w-5 h-5 text-blue-500" />}
                </button>

                <button
                    onClick={() => handleSelect('xp')}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${selected === 'xp'
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-white/10 hover:border-yellow-400 hover:bg-white/5'
                        }`}
                >
                    <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">500 XP Bonus</h3>
                        <p className="text-xs text-slate-400 mt-1">Instantly boost your level</p>
                    </div>
                    {selected === 'xp' && <Check className="w-5 h-5 text-yellow-500" />}
                </button>
            </div>
        </div>
    );
}
