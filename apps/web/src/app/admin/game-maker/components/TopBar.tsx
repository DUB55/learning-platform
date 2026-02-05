'use client';

import React, { useState } from 'react';
import { 
    ArrowLeft, Rocket, Play, Square, Download, Save, 
    Move as MoveIcon, RotateCw, Scaling, Users, Sparkles,
    Undo2, Redo2
} from 'lucide-react';
import { GameMode, GameDesign } from '../types';
import { Collaborators } from './Collaborators';
import { Collaborator } from '../hooks/useMultiplayer';
import { Magic3DModal } from './Magic3DModal';

interface TopBarProps {
    gameMode: GameMode | null;
    setGameMode: (mode: GameMode | null) => void;
    game: GameDesign;
    setGame: React.Dispatch<React.SetStateAction<GameDesign>>;
    undo: () => void;
    redo: () => void;
    historyIndex: number;
    historyLength: number;
    transformMode: 'translate' | 'rotate' | 'scale';
    setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    exportCode: () => void;
    saveGame: () => Promise<void>;
    isSaving: boolean;
    deployGame: () => Promise<void>;
    isDeploying: boolean;
    collaborators: Collaborator[];
    onOpenBrowser: () => void;
    onMagicGenerated: (scene: any) => void;
}

export function TopBar({
    gameMode, setGameMode, game, setGame,
    undo, redo, historyIndex, historyLength,
    transformMode, setTransformMode,
    isPlaying, setIsPlaying,
    exportCode, saveGame, isSaving,
    deployGame, isDeploying,
    collaborators,
    onOpenBrowser,
    onMagicGenerated,
}: TopBarProps) {
    const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);

    return (
        <>
            <Magic3DModal 
                isOpen={isMagicModalOpen}
                onClose={() => setIsMagicModalOpen(false)}
                onGenerated={onMagicGenerated}
            />
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md z-30">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onOpenBrowser}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Switch Engine"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Rocket className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight">Game Maker <span className="text-blue-500">PRO</span></h1>
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    <input 
                        type="text" 
                        value={game.title}
                        onChange={(e) => setGame(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-transparent border-none focus:ring-0 font-medium text-slate-300 hover:text-white transition-colors w-48"
                    />
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-500 mr-2">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{collaborators.length}</span>
                        </div>
                        <Collaborators collaborators={collaborators} />
                    </div>

                    <div className="h-6 w-px bg-white/10" />

                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button 
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={redo}
                                disabled={historyIndex >= historyLength - 1}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                                title="Redo (Ctrl+Y)"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>

                        {gameMode === '3d' && (
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
                            <button 
                                onClick={() => setTransformMode('translate')}
                                className={`p-1.5 rounded-lg transition-all ${transformMode === 'translate' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                title="Translate (W)"
                            >
                                <MoveIcon className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setTransformMode('rotate')}
                                className={`p-1.5 rounded-lg transition-all ${transformMode === 'rotate' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                title="Rotate (E)"
                            >
                                <RotateCw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setTransformMode('scale')}
                                className={`p-1.5 rounded-lg transition-all ${transformMode === 'scale' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                title="Scale (R)"
                            >
                                <Scaling className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button 
                            onClick={() => setIsMagicModalOpen(true)}
                            className="px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                        >
                            <Sparkles className="w-4 h-4" />
                            Magic 3D
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-2 self-center" />
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
                        >
                            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {isPlaying ? 'Stop' : 'Play Test'}
                        </button>
                    </div>
                    <button 
                        onClick={exportCode}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                        title="Export JSON"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={saveGame}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Locally'}
                    </button>
                    <button 
                        onClick={deployGame}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20"
                    >
                        {isDeploying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Rocket className="w-4 h-4" />}
                        {isDeploying ? 'Deploying...' : 'Deploy to Arcade'}
                    </button>
                </div>
            </div>
        </header>
    </>
);
}
