'use client';

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Box, useKeyboardControls, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// --- Game Constants ---
const LANES = [-2, 0, 2]; // Left, Center, Right x-coords
const SPEED_INITIAL = 10;
const JUMP_FORCE = 5;
const GRAVITY = 15;

function Player({ lane, isJumping, onJumpEnd }: { lane: number, isJumping: boolean, onJumpEnd: () => void }) {
    const mesh = useRef<THREE.Group>(null);
    const yVelocity = useRef(0);
    const yPos = useRef(0.5);

    useFrame((state, delta) => {
        if (!mesh.current) return;

        // Lane switching (Lerp)
        const targetX = LANES[lane];
        mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, targetX, delta * 15);

        // Jump Physics
        if (isJumping) {
            if (yPos.current === 0.5) yVelocity.current = JUMP_FORCE;
        }

        yPos.current += yVelocity.current * delta;
        yVelocity.current -= GRAVITY * delta;

        if (yPos.current <= 0.5) {
            yPos.current = 0.5;
            yVelocity.current = 0;
            if (isJumping) onJumpEnd();
        }

        mesh.current.position.y = yPos.current;

        // Running Bob
        if (yPos.current === 0.5) {
            mesh.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.05;
        } else {
            mesh.current.rotation.z = 0; // Stable in air
        }
    });

    return (
        <group ref={mesh} position={[0, 0.5, 0]}>
            <mesh castShadow>
                <boxGeometry args={[0.8, 1, 0.8]} />
                <meshStandardMaterial color="#0ea5e9" />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.5, -0.2]}>
                <boxGeometry args={[0.6, 0.2, 0.4]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
        </group>
    );
}

function Obstacle({ position, type }: { position: [number, number, number], type: 'train' | 'barrier' }) {
    return (
        <group position={position}>
            {type === 'train' ? (
                <mesh castShadow position={[0, 1, 0]}>
                    <boxGeometry args={[1.5, 2, 6]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
            ) : (
                <mesh castShadow position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.5, 1, 0.5]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            )}
        </group>
    );
}

function Coin({ position, active }: { position: [number, number, number], active: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.05;
            ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        }
    });

    if (!active) return null;

    return (
        <group ref={ref} position={position}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

function GameScene({ gameState, onGameOver, onScore }: { gameState: string, onGameOver: () => void, onScore: (s: number) => void }) {
    const [lane, setLane] = useState(1); // 0, 1, 2 indices
    const [isJumping, setIsJumping] = useState(false);

    // Level State
    const [speed, setSpeed] = useState(SPEED_INITIAL);
    const [obstacles, setObstacles] = useState<{ id: number, z: number, lane: number, type: 'train' | 'barrier' }[]>([]);
    const [coins, setCoins] = useState<{ id: number, z: number, lane: number, active: boolean }[]>([]);

    // Refs
    const scoreRef = useRef(0);
    const distanceRef = useRef(0);
    const lastSpawnZ = useRef(20);

    // Controls
    const [sub, getKeys] = useKeyboardControls();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') setLane(l => Math.max(0, l - 1));
            if (e.code === 'ArrowRight' || e.code === 'KeyD') setLane(l => Math.min(2, l + 1));
            if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') setIsJumping(true);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    useFrame((state, delta) => {
        if (gameState !== 'playing') return;

        // Move World (Illusion of player moving forward not needed, easier to move world towards player at 0,0)
        // Actually, let's keep player at Z=0 and move obstacles Z towards negative.
        const moveDist = speed * delta;
        distanceRef.current += moveDist;

        // Update Score based on distance
        const newScore = Math.floor(distanceRef.current);
        if (newScore > scoreRef.current) {
            scoreRef.current = newScore;
            onScore(newScore);
        }

        // Spawn Logic
        if (lastSpawnZ.current < distanceRef.current + 50) {
            spawnChunk(lastSpawnZ.current + 20); // Spawn 20 units ahead
            lastSpawnZ.current += 20;
        }

        // Move Objects
        setObstacles(prev => prev.map(o => ({ ...o, z: o.z - moveDist })).filter(o => o.z > -10));
        setCoins(prev => prev.map(c => ({ ...c, z: c.z - moveDist })).filter(c => c.z > -10));

        // Collision Check
        const playerZ = 0;
        const playerLaneIdx = lane;

        // Obstacles
        for (const obs of obstacles) {
            // Simple box collision
            if (Math.abs(obs.z - playerZ) < 1.5 && obs.lane === playerLaneIdx) {
                // If barrier and jumping, might pass? For now, hard crash on all
                // If it's a barrier (low) and we are high enough?
                // Barrier height 1, ypos 0.5. Top is 1.0. 
                // Player jump peak ~2.0. 
                // Let's implement jump over barriers later, for now crash.
                onGameOver();
            }
        }

        // Coins
        setCoins(prev => prev.map(c => {
            if (c.active && Math.abs(c.z - playerZ) < 1 && c.lane === playerLaneIdx) {
                // Collect!
                // Usually add bonus score or separate currency
                return { ...c, active: false };
            }
            return c;
        }));

        // Speed up
        setSpeed(s => Math.min(s + delta * 0.1, 30)); // Max speed 30
    });

    const spawnChunk = (zStart: number) => {
        const laneIdx = Math.floor(Math.random() * 3);
        const type = Math.random() > 0.5 ? 'train' : 'barrier';

        setObstacles(prev => [...prev, {
            id: Math.random(),
            z: zStart,
            lane: laneIdx,
            type
        }]);

        // Add coins in other lanes
        const coinLane = (laneIdx + 1) % 3;
        setCoins(prev => [...prev, {
            id: Math.random(),
            z: zStart,
            lane: coinLane,
            active: true
        }]);
    };

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 5]} intensity={1} castShadow />

            {/* Floor (Moving texture effect would be nice, but simple gray plane for now) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} receiveShadow>
                <planeGeometry args={[20, 100]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Tracks */}
            {LANES.map(x => (
                <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -20]}>
                    <planeGeometry args={[0.5, 100]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            ))}

            <Player lane={lane} isJumping={isJumping} onJumpEnd={() => setIsJumping(false)} />

            {obstacles.map(o => (
                <Obstacle key={o.id} position={[LANES[o.lane], 0, o.z]} type={o.type} />
            ))}

            {coins.map(c => (
                <Coin key={c.id} position={[LANES[c.lane], 0.5, c.z]} active={c.active} />
            ))}
        </>
    );
}

export default function StudySurfers({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);

    const controlsMap = useMemo(() => [
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['ArrowUp', 'Space', 'KeyW'] },
    ], []);

    return (
        <div className="relative w-full h-[600px] bg-sky-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 3, 6]} rotation={[-0.2, 0, 0]} />
                <KeyboardControls map={controlsMap}>
                    <GameScene 
                        gameState={gameState} 
                        onGameOver={() => {
                            setGameState('gameover');
                            // Award XP based on score
                            if (score > 100) {
                                const xpAmount = Math.min(Math.floor(score / 50), 50);
                                updateXP(xpAmount, `Study Surfers - Score: ${score}`);
                            }
                        }}
                        onScore={(s) => {
                            setScore(s);
                            // Award minor XP for milestones
                            if (s > 0 && s % 1000 === 0) {
                                updateXP(10, `Study Surfers - Milestone: ${s}m`);
                            }
                        }}
                    />
                </KeyboardControls>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                <div className="flex justify-end">
                    <div className="glass-card px-6 py-2">
                        <div className="text-xs text-slate-400">METERS</div>
                        <div className="text-3xl font-bold text-white font-mono">{score}</div>
                    </div>
                </div>

                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-auto">
                        <Trophy className="w-16 h-16 text-cyan-400 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">ENDLESS RUN</h1>
                        <p className="text-slate-300 mb-8">Dodge trains and barriers.</p>
                        <button onClick={() => setGameState('playing')} className="glass-button px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white font-bold flex gap-2 items-center">
                            <Play className="w-5 h-5 fill-current" /> RUN
                        </button>
                    </div>
                )}

                {gameState === 'gameover' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                        <h2 className="text-5xl font-black text-red-500 mb-4">WIPEOUT!</h2>
                        <div className="text-2xl text-white mb-8">Distance: {score}m</div>
                        <button onClick={() => setGameState('playing')} className="glass-button px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-full font-bold flex gap-2 items-center">
                            <RotateCcw className="w-5 h-5" /> RESTART
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
