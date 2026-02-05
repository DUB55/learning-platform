'use client';

import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Calendar, Clock, ChevronRight, 
    Search, LayoutGrid, List, MoreVertical, Play, 
    Rocket, Edit3, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameDesign, GameMode } from '../types';

interface ProjectBrowserProps {
    onSelectGame: (game: GameDesign) => void;
    onNewGame: (mode: GameMode) => void;
}

export function ProjectBrowser({ onSelectGame, onNewGame }: ProjectBrowserProps) {
    const [savedGames, setSavedGames] = useState<GameDesign[]>([]);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const loadGames = () => {
            const games = JSON.parse(localStorage.getItem('admin_games') || '[]');
            setSavedGames(games.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
        };
        loadGames();
        window.addEventListener('storage', loadGames);
        return () => window.removeEventListener('storage', loadGames);
    }, []);

    const deleteGame = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this game?')) {
            const updated = savedGames.filter(g => g.id !== id);
            localStorage.setItem('admin_games', JSON.stringify(updated));
            setSavedGames(updated);
        }
    };

    const filteredGames = savedGames.filter(g => 
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Mijn <span className="text-blue-500">Projecten</span></h2>
                    <p className="text-slate-500 text-sm">Beheer je games en start nieuwe avonturen.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => onNewGame('2d')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 font-bold text-sm transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nieuwe 2D Game
                    </button>
                    <button 
                        onClick={() => onNewGame('3d')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/20 font-bold text-sm transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nieuwe 3D Game
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text"
                        placeholder="Zoek projecten..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent border-none pl-12 pr-4 py-2 text-sm text-white focus:ring-0 placeholder:text-slate-600"
                    />
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {filteredGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/2 rounded-3xl border-2 border-dashed border-white/5">
                    <div className="p-6 bg-white/5 rounded-full">
                        <Rocket className="w-12 h-12 text-slate-700" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-400">Geen projecten gevonden</h3>
                        <p className="text-sm text-slate-600 max-w-xs">Start je eerste game door op een van de knoppen hierboven te klikken.</p>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredGames.map((game) => (
                            <motion.div
                                key={game.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => onSelectGame(game)}
                                className="group relative bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer"
                            >
                                <div className={`aspect-video w-full flex items-center justify-center relative overflow-hidden ${game.mode === '2d' ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                                    {game.mode === '2d' ? (
                                        <LayoutGrid className="w-12 h-12 text-blue-500/20 group-hover:scale-110 transition-transform" />
                                    ) : (
                                        <Globe className="w-12 h-12 text-purple-500/20 group-hover:scale-110 transition-transform" />
                                    )}
                                    
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => deleteGame(game.id, e)}
                                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {game.isPublished && (
                                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-md">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Gepubliceerd</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${game.mode === '2d' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {game.mode}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                                            <Clock className="w-3 h-3" />
                                            {new Date(game.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{game.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{game.description || 'Geen beschrijving'}</p>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                            <Edit3 className="w-3 h-3" />
                                            {game.objects.length} Objects
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredGames.map((game) => (
                        <div 
                            key={game.id}
                            onClick={() => onSelectGame(game)}
                            className="group flex items-center gap-6 p-4 bg-[#0f172a] border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${game.mode === '2d' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                {game.mode === '2d' ? <LayoutGrid className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{game.title}</h4>
                                <p className="text-xs text-slate-500 truncate">{game.description || 'Geen beschrijving'}</p>
                            </div>

                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Laatst gewijzigd</span>
                                <span className="text-xs text-slate-300 font-medium">{new Date(game.updatedAt).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => deleteGame(game.id, e)}
                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-blue-500 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
