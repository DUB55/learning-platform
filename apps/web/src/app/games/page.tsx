'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Gamepad2, Play, Trophy, Star, Crown,
    Crosshair, Car, Box, Grid as GridIcon,
    Ghost as GhostIcon, Spline, Zap, Shield, Sword
} from 'lucide-react';

const GAMES = [
    {
        id: 'minesweeper',
        title: 'Minesweeper',
        description: 'Classic puzzle game. Clear the grid without detonating mines.',
        icon: Box,
        color: 'text-blue-400',
        bg: 'from-blue-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '50 XP / Win'
    },
    {
        id: 'geometry-dash',
        title: 'Neon Dash',
        description: 'Rhythm-based platformer. Jump over spikes to the beat.',
        icon: Zap,
        color: 'text-yellow-400',
        bg: 'from-yellow-500/20 to-orange-600/5',
        status: 'playable',
        xpReward: '100 XP / Level'
    },
    {
        id: 'csgo',
        title: 'Aim Trainer 3D',
        description: 'Train your reflexes and accuracy in this 3D simulation.',
        icon: Crosshair,
        color: 'text-emerald-400',
        bg: 'from-emerald-500/20 to-teal-600/5',
        status: 'playable',
        xpReward: '1 XP / Hit'
    },
    {
        id: 'r6-siege',
        title: 'Tactical Breach',
        description: 'Plan and execute room clearing operations.',
        icon: Shield,
        color: 'text-slate-200',
        bg: 'from-slate-500/20 to-slate-600/5',
        status: 'playable',
        xpReward: '150 XP / Mission'
    },
    {
        id: 'mario-kart',
        title: 'Kart Racing',
        description: '2D Top-down arcade racing.',
        icon: Gamepad2,
        color: 'text-red-400',
        bg: 'from-red-500/20 to-pink-600/5',
        status: 'playable',
        xpReward: '300 XP / Race'
    },
    {
        id: 'clash-royale',
        title: 'Battle Tactics',
        description: 'Deploy units and destroy enemy towers.',
        icon: Crown,
        color: 'text-purple-400',
        bg: 'from-purple-500/20 to-violet-600/5',
        status: 'playable',
        xpReward: '200 XP / Win'
    },
    {
        id: 'subway-surfers',
        title: 'Endless Run',
        description: 'Run as far as you can and collect coins.',
        icon: Spline,
        color: 'text-cyan-400',
        bg: 'from-cyan-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '1 XP / 10m'
    },
    {
        id: 'super-mario',
        title: 'Platformer',
        description: 'Run and jump through levels.',
        icon: GhostIcon, // Using Ghost for "Goomba" vibe
        color: 'text-orange-400',
        bg: 'from-orange-500/20 to-red-600/5',
        status: 'playable',
        xpReward: '100 XP / Level'
    },
    {
        id: 'mini-motorways',
        title: 'City Flows',
        description: 'Connect road networks to prevent traffic jams.',
        icon: GridIcon,
        color: 'text-indigo-400',
        bg: 'from-indigo-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '500 XP / City'
    }
];

export default function GamesHubPage() {
    const router = useRouter();

    return (
        <div className="h-full overflow-y-auto p-8 bg-[#0f172a] relative">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <Gamepad2 className="w-8 h-8 text-purple-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-white">Arcade</h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Relax, earn XP, and train your brain. All games are built to help you
                        improve concentration and reflexes during study breaks.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => game.status === 'playable' && router.push(`/games/${game.id}`)}
                            disabled={game.status === 'coming_soon'}
                            className={`group relative overflow-hidden rounded-2xl border border-white/5 p-6 text-left transition-all duration-300
                                ${game.status === 'playable'
                                    ? 'hover:border-white/20 hover:scale-[1.02] cursor-pointer'
                                    : 'opacity-70 cursor-not-allowed'
                                }
                            `}
                        >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.bg} opacity-50 group-hover:opacity-100 transition-opacity`} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-black/20 backdrop-blur-sm ${game.color}`}>
                                        <game.icon className="w-8 h-8" />
                                    </div>
                                    {game.status === 'playable' ? (
                                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                                            <Play className="w-3 h-3 fill-current" />
                                            Playable
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium">
                                            Coming Soon
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                                <p className="text-slate-400 text-sm mb-6 h-10">{game.description}</p>

                                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-black/20 p-2 rounded-lg w-fit">
                                    <Trophy className="w-3 h-3 text-yellow-400" />
                                    {game.xpReward}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
