'use client';

import BattleTacticsGame from '@/components/games/BattleTacticsGame';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BattleTacticsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0f172a] p-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Arcade
                </button>

                <div className="flex flex-col items-center w-full">
                    <h1 className="text-3xl font-bold text-white mb-2">Battle Tactics</h1>
                    <p className="text-slate-400 mb-8">Deploy units. Destroy the enemy king.</p>

                    <div className="w-full">
                        <BattleTacticsGame />
                    </div>
                </div>
            </div>
        </div>
    );
}
