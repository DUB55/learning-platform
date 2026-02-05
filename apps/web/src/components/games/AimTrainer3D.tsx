'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair, Trophy, RotateCcw, Target as TargetIcon, Play, X, Zap, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';

interface AimTrainerProps {
    onExit?: () => void;
    focusMode?: boolean;
    terms?: any[];
}

function Target({ position, onClick }: { position: [number, number, number], onClick: () => void }) {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.02;
            mesh.current.rotation.y += 0.02;
            const scale = hovered ? 1.4 : 1;
            mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);
        }
    });

    return (
        <mesh
            ref={mesh}
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <octahedronGeometry args={[0.6, 0]} />
            <meshStandardMaterial
                color={hovered ? '#F43F5E' : '#38BDF8'}
                emissive={hovered ? '#F43F5E' : '#38BDF8'}
                emissiveIntensity={0.8}
                wireframe={!hovered}
            />
        </mesh>
    );
}

function GameScene({ onScore, isPlaying }: { onScore: () => void, isPlaying: boolean }) {
    const [targets, setTargets] = useState<{ id: number, pos: [number, number, number] }[]>([]);

    useEffect(() => {
        if (isPlaying) {
            setTargets(Array(3).fill(0).map(() => ({ id: Math.random(), pos: [(Math.random() - 0.5) * 10, Math.random() * 4 + 1, -6] })));
        } else {
            setTargets([]);
        }
    }, [isPlaying]);

    const handleHit = (id: number) => {
        if (!isPlaying) return;
        setTargets(prev => prev.map(t => t.id === id ? { id: Math.random(), pos: [(Math.random() - 0.5) * 10, Math.random() * 4 + 1, -6] } : t));
        onScore();
    };

    return (
        <>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#38BDF8" />
            <pointLight position={[-10, 5, -5]} intensity={1} color="#8B5CF6" />
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={2} />

            <gridHelper args={[30, 30, '#1E293B', '#0F172A']} position={[0, 0, 0]} />

            {targets.map(target => (
                <Target key={target.id} position={target.pos} onClick={() => handleHit(target.id)} />
            ))}
        </>
    );
}

export default function AimTrainer3D({ focusMode, onExit, terms }: AimTrainerProps) {
    const { updateXP } = useAuth();
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
    const [highScore, setHighScore] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('csgo_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('finished');
            
            // Award XP
            if (score > 0) {
                const xpAmount = Math.min(score * 3, 60); // Max 60 XP per run
                updateXP(xpAmount, `Aim Trainer - Score: ${score}`);
            }

            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('csgo_highscore', score.toString());
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft, score, highScore]);

    const startGame = () => {
        setScore(0); setTimeLeft(30); setGameState('playing');
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const onPointerDown = () => {
            if (focusMode) {
                try {
                    canvas.requestPointerLock();
                } catch {}
            }
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (focusMode) {
                if (['Tab'].includes(e.key)) {
                    e.preventDefault();
                }
            }
        };
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [focusMode]);

    return (
        <div className="relative w-full h-[600px] bg-[#020617] rounded-[2.5rem] overflow-hidden border-4 border-slate-900 shadow-2xl">
            <Canvas
                shadows
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    canvasRef.current = gl.domElement as HTMLCanvasElement;
                }}
            >
                <PerspectiveCamera makeDefault position={[0, 1.8, 6]} />
                <PointerLockControls selector="#game-overlay" />
                <Suspense fallback={null}>
                    <GameScene onScore={() => setScore(s => s + 1)} isPlaying={gameState === 'playing'} />
                </Suspense>
            </Canvas>

            <div id="game-overlay" className="absolute inset-0 pointer-events-none">
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                    <div className="bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Time Left</p>
                        <p className={`text-3xl font-black font-mono ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 shadow-2xl text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Targets Hit</p>
                        <p className="text-3xl font-black font-mono text-emerald-400">{score}</p>
                    </div>
                </div>

                {gameState === 'playing' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            <Crosshair className="w-8 h-8 text-white opacity-40" />
                            <div className="absolute inset-0 bg-white/20 blur-sm rounded-full" />
                        </div>
                    </div>
                )}

                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto p-8 text-center z-50">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <TargetIcon className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic">AIM OVERLOAD</h1>
                        <p className="text-slate-400 mb-10 max-w-sm font-medium">Reflexes define survival. Eliminate all targets in 30 seconds.</p>
                        <button onClick={startGame} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/30 active:scale-95 uppercase tracking-widest">
                            READY UP
                        </button>
                        <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">Click to Lock Cursor</p>
                    </div>
                )}

                {gameState === 'finished' && (
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto p-8 text-center z-50">
                        <Trophy className="w-20 h-20 text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">MISSION END</h2>
                        <div className="flex gap-12 mb-10">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Kills</p>
                                <p className="text-3xl font-black text-white">{score}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Record</p>
                                <p className="text-3xl font-black text-yellow-400">{highScore}</p>
                            </div>
                        </div>
                        <button onClick={startGame} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/30 w-full max-w-xs active:scale-95 uppercase tracking-widest">
                            RE-ENGAGE
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-30">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600" /><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Flick Training</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600" /><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Zero Latency</span></div>
            </div>
        </div>
    );
}
