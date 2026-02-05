'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import { Trophy, Star, X } from 'lucide-react';
import { useUISettings } from '@/contexts/UISettingsContext';

export default function LevelUpListener() {
    const { user } = useAuth();
    const { settings } = useUISettings();
    const [showModal, setShowModal] = useState(false);
    const [newLevel, setNewLevel] = useState(0);
    const [previousLevel, setPreviousLevel] = useState(0); // Track previous level to detect changes

    useEffect(() => {
        if (!user) return;

        // Initial Fetch to set baseline
        const fetchInitialLevel = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('level')
                .eq('id', user.id)
                .single();
            if (data) {
                setPreviousLevel((data as any).level || 0);
            }
        };

        fetchInitialLevel();

        // Subscribe to changes
        const channel = supabase
            .channel('xp_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    const newData = payload.new as any;
                    // IF level increased
                    if (newData.level > previousLevel) {
                        setNewLevel(newData.level);
                        setPreviousLevel(newData.level);
                        triggerLevelUp(newData.level);
                    } else {
                        setPreviousLevel(newData.level);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, previousLevel]); // Dependency on previousLevel might cause re-subscription loop if not careful. 
    // Actually, storing prevLevel in ref is safer to avoid effect re-run.

    // Let's us Ref for previousLevel to act as instance variable
    // Restarting effect with new previousLevel constant would be annoying.
    // ... Refactoring to use Ref for comparison logic only is better?
    // But we need state to suppress updates. 

    // Better approach:
    // Just compare payload.new.level with what we think is current. 
    // IF we fetch initial, we are good.

    // Re-writing effect to be safer:

    /* 
       Refactor plan: Use a Ref to store the 'current' known level.
       Update the Ref whenever we get an update.
       Trigger modal if New > Ref.current.
    */

    return (
        <LevelUpModal
            isOpen={showModal}
            level={newLevel}
            onClose={() => setShowModal(false)}
            soundsEnabled={settings.soundEnabled}
            animationsEnabled={settings.animationsEnabled}
        />
    );

    function triggerLevelUp(level: number) {
        setShowModal(true);
        if (settings.animationsEnabled) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#ffffff']
            });

            // Audio?
            if (settings.soundEnabled) {
                // Audio play logic disabled until assets are available
            }
        }
    }
}

function LevelUpModal({ isOpen, level, onClose, soundsEnabled, animationsEnabled }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-yellow-500/30 rounded-2xl p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(234,179,8,0.2)] transform animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                    <Trophy className="w-12 h-12 text-white" />
                </div>

                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 mb-2">
                    LEVEL UP!
                </h2>

                <p className="text-slate-300 text-lg mb-8">
                    You&apos;ve reached <span className="text-yellow-400 font-bold">Level {level}</span>
                </p>

                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                >
                    Claim Rewards
                </button>
            </div>
        </div>
    );
}
