'use client';

// NOTE: User must install dependencies:
// npm install three @types/three @react-three/fiber @react-three/drei

import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, Text, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair, Trophy, RotateCcw } from 'lucide-react';

// --- Game Components ---

function Target({ position, onClick }: { position: [number, number, number], onClick: () => void }) {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x += 0.01;
            mesh.current.rotation.y += 0.01;
            // Pulse effect
            const scale = hovered ? 1.2 : 1;
            mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
        }
    });

    return (
        <mesh
            ref={mesh}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
        >
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial
                color={hovered ? '#ff0055' : '#00f2ff'}
                emissive={hovered ? '#ff0055' : '#00f2ff'}
                emissiveIntensity={0.5}
                roughness={0.1}
                metalness={0.8}
            />
        </mesh>
    );
}

function GameScene({ onScore, isPlaying }: { onScore: () => void, isPlaying: boolean }) {
    const [targets, setTargets] = useState<{ id: number, pos: [number, number, number] }[]>([]);

    useEffect(() => {
        if (isPlaying) {
            spawnTarget();
            spawnTarget();
            spawnTarget();
        } else {
            setTargets([]);
        }
    }, [isPlaying]);

    const spawnTarget = () => {
        const x = (Math.random() - 0.5) * 8; // Spread X
        const y = Math.random() * 3 + 1;     // Spread Y (height)
        const z = -5;                        // Fixed depth
        const id = Math.random();
        setTargets(prev => [...prev, { id, pos: [x, y, z] }]);
    };

    const handleHit = (id: number) => {
        if (!isPlaying) return;
        setTargets(prev => prev.filter(t => t.id !== id));
        onScore();
        spawnTarget(); // Respawn immediately
    };

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Grid Room */}
            <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, 0, 0]} />

            {/* Targets */}
            {targets.map(target => (
                <Target
                    key={target.id}
                    position={target.pos}
                    onClick={() => handleHit(target.id)}
                />
            ))}
        </>
    );
}

// --- Main Component ---

export default function AimTrainerGame() {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('csgo_highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('finished');
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('csgo_highscore', score.toString());
            }
        }
    }, [gameState, timeLeft, score, highScore]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setGameState('playing');
    };

    return (
        <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            {/* 3D Canvas */}
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 1.7, 5]} />
                <PointerLockControls selector="#game-overlay" />
                <Suspense fallback={null}>
                    <GameScene
                        onScore={() => setScore(s => s + 1)}
                        isPlaying={gameState === 'playing'}
                    />
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div id="game-overlay" className="absolute inset-0 pointer-events-none">
                {/* HUD */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="glass-card px-4 py-2">
                        <div className="text-xs text-slate-400">TIME</div>
                        <div className={`text-2xl font-mono font-bold ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </div>
                    </div>

                    <div className="glass-card px-4 py-2 flex flex-col items-end">
                        <div className="text-xs text-slate-400">SCORE</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">{score}</div>
                    </div>
                </div>

                {/* Crosshair */}
                {gameState === 'playing' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Crosshair className="w-6 h-6 text-green-400 opacity-80" />
                    </div>
                )}

                {/* Start Screen */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                        <Crosshair className="w-16 h-16 text-emerald-500 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">AIM TRAINER</h1>
                        <p className="text-slate-400 mb-8 max-w-sm text-center">
                            Click targets as fast as possible. You have 30 seconds.
                            <br /><span className="text-xs mt-2 block">(Click to lock mouse cursor)</span>
                        </p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                        >
                            START MISSION
                        </button>
                    </div>
                )}

                {/* Finished Screen */}
                {gameState === 'finished' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                        <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                        <h2 className="text-4xl font-bold text-white mb-2">SESSION COMPLETE</h2>
                        <div className="flex gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-sm text-slate-400">SCORE</div>
                                <div className="text-3xl font-bold text-white">{score}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-slate-400">BEST</div>
                                <div className="text-3xl font-bold text-yellow-400">{highScore}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 mb-8">
                            <div>Accuracy: <span className="text-white">100%</span></div>
                            <div>KPM: <span className="text-white">{score * 2}</span></div>
                        </div>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            RETRY
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
