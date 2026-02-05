'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Trophy, Skull, Coins, Heart, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameDesign } from '../types';
import { Object3D } from './Object3D';
import Effects from './Effects';
import { Director } from './Director';

interface GamePlayerProps {
    game: GameDesign;
    onExit: () => void;
}

export function GamePlayer({ game, onExit }: GamePlayerProps) {
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [key, setKey] = useState(0); // For restarting

    const restart = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setKey(prev => prev + 1);
    };

    if (game.mode === '2d') {
        // Fallback to existing 2D renderer logic or a new one
        return (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
                <div className="text-white text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">2D Player is under construction</h2>
                    <button onClick={onExit} className="px-6 py-2 bg-blue-600 rounded-xl font-bold">Terug naar Editor</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0f172a] z-[100] flex flex-col overflow-hidden">
            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-[110] bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <div className="flex items-center gap-8 pointer-events-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Score</span>
                        <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="text-2xl font-black text-white tabular-nums">{score}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Lives</span>
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                            <span className="text-2xl font-black text-white tabular-nums">{lives}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center pointer-events-auto">
                    <h1 className="text-xl font-black text-white tracking-tighter italic uppercase">{game.title}</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Playing Mode</p>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <button 
                        onClick={restart}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                        title="Restart"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onExit}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-2xl font-black text-sm transition-all"
                    >
                        <X className="w-4 h-4" />
                        STOP SPELEN
                    </button>
                </div>
            </div>

            {/* 3D World */}
            <div className="flex-1">
                <Canvas shadows key={key}>
                    <Suspense fallback={null}>
                        <PerspectiveCamera 
                            makeDefault 
                            position={[
                                game.settings.cameraMode === 'topDown' ? 0 : 400,
                                game.settings.cameraMode === 'topDown' ? 800 : 400,
                                game.settings.cameraMode === 'topDown' ? 0 : 400
                            ]} 
                            fov={50} 
                        />
                        {game.settings.cameraMode === 'orbit' && <OrbitControls makeDefault />}
                        
                        <Sky 
                            sunPosition={[100, 10, 100]} 
                            turbidity={game.settings.weather === 'storm' ? 10 : 0.1}
                            rayleigh={game.settings.weather === 'storm' ? 0.5 : 1}
                        />
                        <Environment preset="city" />
                        <ambientLight intensity={game.settings.ambientLightIntensity || 0.5} />
                        
                        {game.settings.fogDensity && (
                            <fog attach="fog" args={[game.settings.fogColor || '#000', 0, game.settings.fogDensity * 10000]} />
                        )}

                        <Physics gravity={[0, -(game.settings.gravity as number || 9.81) * 100, 0]}>
                            {game.objects.map(obj => (
                                <Object3D 
                                    key={obj.id}
                                    obj={obj}
                                    isSelected={false}
                                    onSelect={() => {}}
                                    onUpdate={() => {}}
                                    transformMode="translate"
                                />
                            ))}
                        </Physics>

                        {/* @ts-ignore */}
                        {game.orchestration && (
                            <Director 
                                /* @ts-ignore */
                                orchestration={game.orchestration} 
                                isPlaying={gameState === 'playing'} 
                            />
                        )}

                        {game.settings.rendering && <Effects settings={game.settings.rendering} />}
                    </Suspense>
                </Canvas>
            </div>

            {/* Game Over / Win Overlays */}
            <AnimatePresence>
                {gameState !== 'playing' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-md w-full bg-[#1e293b] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl"
                        >
                            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${gameState === 'won' ? 'bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]'}`}>
                                {gameState === 'won' ? <Trophy className="w-12 h-12 text-white" /> : <Skull className="w-12 h-12 text-white" />}
                            </div>
                            
                            <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4 uppercase">
                                {gameState === 'won' ? 'Level Gehaald!' : 'Game Over'}
                            </h2>
                            
                            <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                                {gameState === 'won' 
                                    ? `Fantastisch! Je hebt de finish bereikt met een score van ${score}.` 
                                    : 'Helaas, je hebt het niet gered. Probeer het opnieuw!'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={restart}
                                    className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-sm border border-white/10 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    OPNIEUW
                                </button>
                                <button 
                                    onClick={onExit}
                                    className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all"
                                >
                                    EDITOR
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
