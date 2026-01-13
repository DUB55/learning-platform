'use client';

import Sidebar from '@/components/Sidebar';
import PlatformerGame from '@/components/games/PlatformerGame';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuperMarioPage() {
    const router = useRouter();

    return (
        <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Arcade
                    </button>

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Platformer</h1>
                            <p className="text-slate-400">Run, jump, and reach the flag!</p>
                        </div>
                    </div>

                    <PlatformerGame />
                </div>
            </main>
        </div>
    );
}
