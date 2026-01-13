'use client';

import GeometryDashGame from '@/components/games/GeometryDashGame';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GeometryDashPage() {
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
                    <h1 className="text-3xl font-bold text-white mb-2">Neon Dash</h1>
                    <p className="text-slate-400 mb-8">Jump to the beat. Avoid the spikes.</p>

                    <div className="w-full max-w-4xl">
                        <GeometryDashGame />
                    </div>
                </div>
            </div>
        </div>
    );
}
