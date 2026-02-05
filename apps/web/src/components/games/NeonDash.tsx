'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Play, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Flame, X, ArrowLeft, Plus, Settings, Share2, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import NeonDashLevelMaker from './NeonDashLevelMaker';

interface LevelElement {
    x: number;
    type: 'spike' | 'block';
}

interface NeonDashProps {
    onExit?: () => void;
    terms?: any[];
    focusMode?: boolean;
}

export default function NeonDash({ onExit, terms, focusMode }: NeonDashProps) {
    const { updateXP } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'editor'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [customLevelData, setCustomLevelData] = useState<LevelElement[] | null>(null);
    const [isCustomMode, setIsCustomMode] = useState(false);

    // Levels Data
    const LEVELS = [
        { name: 'Neon Origins', speed: 6, color: '#38BDF8', difficulty: 'Easy' },
        { name: 'Vibrant Velocity', speed: 8, color: '#A855F7', difficulty: 'Medium' },
        { name: 'Midnight Dash', speed: 10, color: '#F43F5E', difficulty: 'Hard' },
        { name: 'Cyber Chaos', speed: 13, color: '#10B981', difficulty: 'Expert' }
    ];

    const SPEED_INITIAL = LEVELS[0].speed;

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    const FLOOR_HEIGHT = 60;

    const playerRef = useRef({ x: 100, y: 0, dy: 0, width: 32, height: 32, rotation: 0, grounded: false });
    const obstaclesRef = useRef<{ x: number, type: 'spike' | 'block', width: number, height: number, passed: boolean }[]>([]);
    const frameRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const speedRef = useRef(SPEED_INITIAL);
    const particlesRef = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]>([]);
    const levelDistanceRef = useRef(0);

    useEffect(() => {
        const saved = localStorage.getItem('geo_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnObstacle = useCallback((canvasWidth: number) => {
        if (isCustomMode && customLevelData) {
            // In custom mode, obstacles are pre-defined by distance
            return;
        }

        const types: ('spike' | 'block')[] = ['spike', 'spike', 'block'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Add more complex patterns for harder levels
        if (currentLevel >= 1 && Math.random() > 0.7) {
            // Triple spikes or double blocks
            obstaclesRef.current.push({ 
                x: canvasWidth + 100, 
                type: 'spike', 
                width: 32, 
                height: 32, 
                passed: false 
            });
            obstaclesRef.current.push({ 
                x: canvasWidth + 132, 
                type: 'spike', 
                width: 32, 
                height: 32, 
                passed: false 
            });
        } else {
            obstaclesRef.current.push({ 
                x: canvasWidth + 100, 
                type, 
                width: type === 'block' ? 40 : 32, 
                height: type === 'block' ? 40 : 32, 
                passed: false 
            });
        }
    }, [currentLevel, isCustomMode, customLevelData]);

    const resetGame = useCallback((levelIdx: number, customData: LevelElement[] | null = null) => {
        playerRef.current = { x: 100, y: 0, dy: 0, width: 32, height: 32, rotation: 0, grounded: false };
        obstaclesRef.current = [];
        scoreRef.current = 0;
        levelDistanceRef.current = 0;
        
        if (customData) {
            setIsCustomMode(true);
            setCustomLevelData(customData);
            speedRef.current = 7; // Fixed speed for custom levels
            // Pre-load obstacles from custom data
            customData.forEach(el => {
                obstaclesRef.current.push({
                    x: 800 + el.x, // Offset from start
                    type: el.type,
                    width: el.type === 'block' ? 40 : 32,
                    height: el.type === 'block' ? 40 : 32,
                    passed: false
                });
            });
        } else {
            setIsCustomMode(false);
            setCustomLevelData(null);
            speedRef.current = LEVELS[levelIdx].speed;
        }

        setScore(0);
        setGameState('playing');
        setCurrentLevel(levelIdx);
        particlesRef.current = [];
    }, []);

    const update = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        levelDistanceRef.current += speedRef.current;

        // Clear Screen with Gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#0a0f1e');
        skyGradient.addColorStop(1, '#020617');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const offset = (levelDistanceRef.current) % gridSize;

        ctx.beginPath();
        for (let x = -offset; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        const floorY = canvas.height - FLOOR_HEIGHT;

        // Floor with Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = isCustomMode ? '#10B981' : LEVELS[currentLevel].color;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, floorY, canvas.width, FLOOR_HEIGHT);
        ctx.strokeStyle = isCustomMode ? '#10B981' : LEVELS[currentLevel].color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(canvas.width, floorY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Player Physics
        const player = playerRef.current;
        player.dy += GRAVITY;
        player.y += player.dy;
        player.rotation += player.grounded ? 0 : 0.2;

        if (player.y + player.height >= floorY) {
            player.y = floorY - player.height;
            player.dy = 0;
            player.grounded = true;
            const snap = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
            player.rotation = snap;

            if (Math.random() > 0.4) {
                particlesRef.current.push({
                    x: player.x,
                    y: player.y + player.height,
                    vx: -speedRef.current * 0.5 - Math.random(),
                    vy: -Math.random() * 2,
                    life: 15,
                    color: isCustomMode ? '#10B981' : LEVELS[currentLevel].color
                });
            }
        } else {
            player.grounded = false;
        }

        // Obstacles
        const obstacles = obstaclesRef.current;
        if (!isCustomMode && (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > 350 + Math.random() * 250)) {
            spawnObstacle(canvas.width);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= speedRef.current;

            // Draw Obstacle with glow
            ctx.shadowBlur = 15;
            if (obs.type === 'spike') {
                ctx.fillStyle = '#F43F5E';
                ctx.shadowColor = '#F43F5E';
                ctx.beginPath();
                ctx.moveTo(obs.x, floorY);
                ctx.lineTo(obs.x + obs.width / 2, floorY - obs.height);
                ctx.lineTo(obs.x + obs.width, floorY);
                ctx.fill();
            } else {
                ctx.fillStyle = '#8B5CF6';
                ctx.shadowColor = '#8B5CF6';
                ctx.fillRect(obs.x, floorY - obs.height, obs.width, obs.height);
                ctx.strokeStyle = '#A78BFA';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x + 2, floorY - obs.height + 2, obs.width - 4, obs.height - 4);
            }
            ctx.shadowBlur = 0;

            // Collision
            const b = 4;
            if (player.x + 32 - b > obs.x && player.x + b < obs.x + obs.width &&
                player.y + 32 - b > floorY - obs.height && player.y + b < floorY) {
                handleGameOver();
                return;
            }

            if (!obs.passed && player.x > obs.x + obs.width) {
                obs.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
                if (!isCustomMode && scoreRef.current % 10 === 0) speedRef.current += 0.3;
            }

            if (obs.x + obs.width < 0) {
                if (!isCustomMode) obstacles.splice(i, 1);
                // In custom mode, we keep them or loop them? 
                // For now just let them disappear.
            }
        }

        // Draw Player
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.rotate(player.rotation);
        
        // Player Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = isCustomMode ? '#10B981' : LEVELS[currentLevel].color;
        
        // Player Body
        ctx.fillStyle = isCustomMode ? '#10B981' : LEVELS[currentLevel].color;
        ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
        
        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(player.width / 4, -player.height / 4, 8, 8);
        
        ctx.restore();

        // Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 15;
            ctx.fillRect(p.x, p.y, 3, 3);
            ctx.globalAlpha = 1;
            if (p.life <= 0) particlesRef.current.splice(i, 1);
        }

    }, [isCustomMode, currentLevel, spawnObstacle]);

    const handleGameOver = () => {
        setGameState('gameover');
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
        
        // Award XP based on score
        if (scoreRef.current > 0) {
            const xpAmount = Math.min(scoreRef.current * 2, 50); // Max 50 XP per run
            updateXP(xpAmount, `Neon Dash - Score: ${scoreRef.current}`);
        }

        if (!isCustomMode && scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
            localStorage.setItem('geo_highscore', scoreRef.current.toString());
        }
    };

    const startGame = () => {
        if (isCustomMode && customLevelData) {
            resetGame(0, customLevelData);
        } else {
            resetGame(currentLevel);
        }
    };

    useEffect(() => {
        if (gameState !== 'playing') return;
        const animate = () => { update(); frameRef.current = requestAnimationFrame(animate); };
        frameRef.current = requestAnimationFrame(animate);
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    }, [gameState, update]);

    const jump = useCallback(() => {
        if (gameState !== 'playing') return;
        if (playerRef.current.grounded) {
            playerRef.current.dy = JUMP_FORCE;
            playerRef.current.grounded = false;
        }
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (gameState === 'start') {
                    // Do nothing, let user click level
                } else if (gameState === 'gameover') {
                    startGame();
                } else if (gameState === 'playing') {
                    jump();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, jump]);

    if (gameState === 'editor') {
        return <NeonDashLevelMaker onBack={() => setGameState('start')} onPlay={(data) => resetGame(0, data)} />;
    }

    return (
        <div className="flex flex-col items-center p-6 w-full max-w-4xl mx-auto select-none">
            <div className="w-full flex justify-between items-center mb-8 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-10">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Obstacles</p>
                        <p className="text-3xl font-black text-white">{score}</p>
                    </div>
                    {!isCustomMode && (
                        <div className="text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Record</p>
                            <p className="text-3xl font-black text-yellow-500">{highScore}</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setGameState('editor')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <Plus className="w-4 h-4" /> Level Maker
                    </button>
                    <div className="bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">{isCustomMode ? 'CUSTOM' : `Level ${currentLevel + 1}`}</p>
                        <p className="text-xs font-bold text-white">{isCustomMode ? 'User Created' : LEVELS[currentLevel].name}</p>
                    </div>
                </div>
            </div>

            <div className="relative group/canvas">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    onMouseDown={() => { 
                        if (gameState === 'playing') jump(); 
                        else if (gameState === 'gameover') startGame();
                    }}
                    className="rounded-[2.5rem] border-4 border-slate-900 shadow-2xl bg-[#0a0f1e] max-w-full cursor-pointer touch-none"
                />

                {gameState === 'start' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[2.5rem] backdrop-blur-sm z-20">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Zap className="w-10 h-10 text-blue-500" />
                        </div>
                        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic">NEON DASH</h1>
                        <p className="text-slate-400 mb-10 font-medium">Jump through the void and defy gravity.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                            {LEVELS.map((level, idx) => (
                                <button
                                    key={level.name}
                                    onClick={() => resetGame(idx)}
                                    className="group relative overflow-hidden bg-slate-900/50 border-2 border-white/10 p-6 rounded-2xl hover:border-white/30 transition-all text-left"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-white">{level.name}</h3>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-white/10 ${
                                            level.difficulty === 'Easy' ? 'text-emerald-400' :
                                            level.difficulty === 'Medium' ? 'text-yellow-400' :
                                            level.difficulty === 'Hard' ? 'text-rose-400' : 'text-purple-400'
                                        }`}>
                                            {level.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Zap className="w-4 h-4" />
                                        <span>Speed: {level.speed}x</span>
                                    </div>
                                    <div 
                                        className="absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:w-full"
                                        style={{ backgroundColor: level.color, width: '0%' }}
                                    />
                                </button>
                            ))}
                        </div>
                        
                        {/* Custom Levels Section */}
                        {localStorage.getItem('neon_dash_custom_levels') && (
                            <div className="mt-6 w-full max-w-2xl px-4">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4 text-center">Your Custom Levels</p>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {JSON.parse(localStorage.getItem('neon_dash_custom_levels') || '[]').map((level: any, i: number) => (
                                        <button 
                                            key={i}
                                            onClick={() => resetGame(0, level.elements)}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold whitespace-nowrap"
                                        >
                                            {level.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-30 animate-in fade-in zoom-in duration-300 rounded-[2.5rem]">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
                            <X className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">CRASHED!</h2>
                        <p className="text-slate-400 mb-8 font-medium">Obstacles passed: {score}</p>
                        <div className="flex gap-4 w-full max-w-xs">
                            <button onClick={startGame} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
                                TRY AGAIN
                            </button>
                            <button onClick={() => setGameState('start')} className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10">
                                MENU
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center gap-6 text-slate-600 font-bold opacity-40 uppercase tracking-[0.4em] text-[10px]">
                <span>Space to Jump</span>
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>Tap to Dash</span>
            </div>
        </div>
    );
}
