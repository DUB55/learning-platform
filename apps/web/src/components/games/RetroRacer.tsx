'use client';

// NOTE: Uses R3F dependencies already installed.

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Trophy, Play, RotateCcw, AlertTriangle, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// --- Game Logic Constants ---
const TRACK_RADIUS = 30;
const TRACK_WIDTH = 8;
const PLAYER_SPEED = 0.5;
const AI_SPEED = 0.48;

function Kart({
    color,
    angle,
    offset,
    isPlayer = false,
    itemHeld = null
}: {
    color: string,
    angle: number,
    offset: number,
    isPlayer?: boolean,
    itemHeld?: string | null
}) {
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (group.current) {
            // Position on circular track
            // Angle determines Z/X position. Offset determines distance from center track line.
            // We rotate the WORLD around the player usually, but here let's move the player on the circle.

            const r = TRACK_RADIUS + offset;
            const x = Math.sin(angle) * r;
            const z = Math.cos(angle) * r;

            group.current.position.set(x, 0.5, z);
            group.current.rotation.y = angle + Math.PI / 2;

            // Bobbing animation
            if (isPlayer) {
                group.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 10) * 0.05;
            }
        }
    });

    return (
        <group ref={group}>
            {/* Kart Body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.5, 2]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Wheels */}
            {[[-0.6, 0.8], [0.6, 0.8], [-0.6, -0.8], [0.6, -0.8]].map(([wx, wz], i) => (
                <mesh key={i} position={[wx, -0.2, wz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.3]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            ))}
            {/* Driver Head */}
            <mesh position={[0, 0.5, -0.2]}>
                <sphereGeometry args={[0.35]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Item Indicator */}
            {itemHeld && isPlayer && (
                <mesh position={[0, 1.2, 0]}>
                    <boxGeometry args={[0.3, 0.3, 0.3]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
                </mesh>
            )}
        </group>
    );
}

function ItemBox({ angle, offset, active, onCollect }: { angle: number, offset: number, active: boolean, onCollect: () => void }) {
    const ref = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (ref.current) {
            const r = TRACK_RADIUS + offset;
            ref.current.position.set(Math.sin(angle) * r, 1, Math.cos(angle) * r);
            ref.current.rotation.y += 0.02;
            ref.current.rotation.x += 0.02;
        }
    });

    // Check collision in parent/manager normally, but simple distance check here?
    // We'll rely on the parent GameScene to check collisions for simplicity/perf

    if (!active) return null;

    return (
        <group ref={ref}>
            <mesh>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial color="#fbbf24" transparent opacity={0.8} emissive="#fbbf24" emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}

function Track() {
    return (
        <group>
            {/* Road */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <ringGeometry args={[TRACK_RADIUS - TRACK_WIDTH / 2, TRACK_RADIUS + TRACK_WIDTH / 2, 128]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>
            {/* Grass/Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#1c4d26" />
            </mesh>
            {/* Start Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[Math.sin(0) * TRACK_RADIUS, 0.01, Math.cos(0) * TRACK_RADIUS]} receiveShadow>
                <planeGeometry args={[TRACK_WIDTH, 2]} />
                <meshStandardMaterial color="#ffffff" />
                {/* Checkerboard texture would be better here */}
            </mesh>
        </group>
    );
}

function GameScene({ gameState, onFinish }: { gameState: string, onFinish: (pos: number) => void }) {
    // Game State
    const [playerAngle, setPlayerAngle] = useState(0);
    const [playerOffset, setPlayerOffset] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [laps, setLaps] = useState(0);

    // Opponents
    const [opponents, setOpponents] = useState([
        { id: 1, angle: 0.1, offset: 2, speed: AI_SPEED, color: '#ef4444', lap: 0 }, // Mario Red
        { id: 2, angle: -0.1, offset: -2, speed: AI_SPEED * 0.95, color: '#22c55e', lap: 0 }, // Luigi Green
    ]);

    // Items
    const [itemBoxes, setItemBoxes] = useState([
        { id: 1, angle: Math.PI / 2, offset: 0, active: true },
        { id: 2, angle: Math.PI, offset: 2, active: true },
        { id: 3, angle: Math.PI * 1.5, offset: -2, active: true },
    ]);
    const [holdingItem, setHoldingItem] = useState<string | null>(null);

    // Camera Ref
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    // Keys
    const keys = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        const kd = (e: KeyboardEvent) => keys.current[e.code] = true;
        const ku = (e: KeyboardEvent) => keys.current[e.code] = false;
        window.addEventListener('keydown', kd);
        window.addEventListener('keyup', ku);
        return () => {
            window.removeEventListener('keydown', kd);
            window.removeEventListener('keyup', ku);
        };
    }, []);

    useFrame((state, delta) => {
        if (gameState !== 'playing') return;

        // 1. Update Player Physics
        // Acceleration
        if (keys.current['ArrowUp'] || keys.current['KeyW']) {
            setSpeed(s => Math.min(s + delta * 0.5, PLAYER_SPEED * (holdingItem === 'mushroom' ? 1.5 : 1)));
        } else {
            setSpeed(s => Math.max(s - delta * 0.3, 0));
        }

        // Steering
        if (speed > 0.1) {
            if (keys.current['ArrowLeft'] || keys.current['KeyA']) setPlayerOffset(o => Math.max(o - delta * 10, -TRACK_WIDTH / 2 + 1));
            if (keys.current['ArrowRight'] || keys.current['KeyD']) setPlayerOffset(o => Math.min(o + delta * 10, TRACK_WIDTH / 2 - 1));
        }

        // Move Player (Angular velocity = speed / radius)
        const angularSpeed = speed / TRACK_RADIUS;
        const nextAngle = playerAngle + angularSpeed;

        // Lap Counting
        if (Math.floor((nextAngle + Math.PI) / (2 * Math.PI)) > Math.floor((playerAngle + Math.PI) / (2 * Math.PI))) {
            const newLap = laps + 1;
            setLaps(newLap);
            if (newLap >= 3) {
                // Finish Logic
                // Calc position
                let pos = 1;
                opponents.forEach(o => {
                    if (o.lap > newLap || (o.lap === newLap && o.angle > nextAngle)) pos++;
                });
                onFinish(pos);
            }
        }
        setPlayerAngle(nextAngle);

        // 2. Update AI
        setOpponents(prev => prev.map(opp => {
            const oppAngularSpeed = opp.speed / TRACK_RADIUS;
            const nextOppAngle = opp.angle + oppAngularSpeed;
            // AI Lap Counting
            let nextLap = opp.lap;
            if (Math.floor((nextOppAngle + Math.PI) / (2 * Math.PI)) > Math.floor((opp.angle + Math.PI) / (2 * Math.PI))) {
                nextLap++;
            }
            return { ...opp, angle: nextOppAngle, lap: nextLap };
        }));

        // 3. Item Collision
        itemBoxes.forEach(box => {
            if (!box.active) return;
            // Simple angular distance check + radial distance check
            // Normalize angles to 0-2PI relative match? Easier: convert to world pos distance
            const boxPos = new THREE.Vector3(Math.sin(box.angle) * (TRACK_RADIUS + box.offset), 0, Math.cos(box.angle) * (TRACK_RADIUS + box.offset));
            const playerPos = new THREE.Vector3(Math.sin(playerAngle) * (TRACK_RADIUS + playerOffset), 0, Math.cos(playerAngle) * (TRACK_RADIUS + playerOffset));

            if (boxPos.distanceTo(playerPos) < 2) {
                // Collect
                setItemBoxes(prev => prev.map(b => b.id === box.id ? { ...b, active: false } : b));
                if (!holdingItem) setHoldingItem('mushroom'); // Always mushroom for MVP

                // Respawn box after 5s
                setTimeout(() => {
                    setItemBoxes(prev => prev.map(b => b.id === box.id ? { ...b, active: true } : b));
                }, 5000);
            }
        });

        // Use Item
        if (keys.current['Space'] && holdingItem) {
            setHoldingItem(null);
            // Boost effect handled in speed calc
            // Temporarily force max speed boost
            setSpeed(PLAYER_SPEED * 1.5);
            setTimeout(() => setSpeed(PLAYER_SPEED), 2000);
        }

        // 5. Update Camera
        if (cameraRef.current) {
            // Camera follows player
            const camDist = 8;
            const camHeight = 4;
            const cx = Math.sin(playerAngle) * TRACK_RADIUS - Math.sin(playerAngle) * camDist;
            const cz = Math.cos(playerAngle) * TRACK_RADIUS - Math.cos(playerAngle) * camDist;

            cameraRef.current.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.1);
            cameraRef.current.lookAt(
                Math.sin(playerAngle) * TRACK_RADIUS,
                0,
                Math.cos(playerAngle) * TRACK_RADIUS
            );
        }
    });

    return (
        <>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, -10]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 20, 10]} intensity={1} castShadow />
            <Stars />

            <Track />

            {/* Player */}
            <Kart color="#3b82f6" angle={playerAngle} offset={playerOffset} isPlayer itemHeld={holdingItem} />

            {/* AI */}
            {opponents.map(opp => (
                <Kart key={opp.id} color={opp.color} angle={opp.angle} offset={opp.offset} />
            ))}

            {/* Items */}
            {itemBoxes.map(box => (
                <ItemBox key={box.id} angle={box.angle} offset={box.offset} active={box.active} onCollect={() => { }} />
            ))}
        </>
    );
}

// --- Main Component ---

export default function RetroRacer({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'finished'>('start');
    const [position, setPosition] = useState(0);

    const handleFinish = (pos: number) => {
        setPosition(pos);
        setGameState('finished');
        
        // Award XP
        const xpAmount = pos === 1 ? 50 : pos === 2 ? 30 : 20;
        updateXP(xpAmount, `Retro Racer - Finished at Position: ${pos}`);
    };

    return (
        <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <Canvas shadows>
                <Suspense fallback={null}>
                    <GameScene gameState={gameState} onFinish={handleFinish} />
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                {/* HUD */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="glass-card px-4 py-2">
                        <div className="text-xs text-slate-400">LAP</div>
                        <div className="text-2xl font-bold text-white">1/3</div>
                    </div>
                    <button
                        onClick={onExit}
                        className="glass-card p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <Home className="w-6 h-6" />
                    </button>
                </div>

                {/* Start Screen */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                        <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">RETRO RACER</h1>
                        <p className="text-slate-400 mb-8">Race against the AI. 3 Laps.</p>
                        <button
                            onClick={() => setGameState('playing')}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            START ENGINE
                        </button>
                    </div>
                )}

                {/* Finish Screen */}
                {gameState === 'finished' && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center pointer-events-auto">
                        <h2 className="text-5xl font-black text-white mb-4 italic">FINISHED!</h2>
                        <div className="text-3xl text-yellow-400 mb-8 font-bold">
                            {position === 1 ? '1st PLACE 🏆' : position === 2 ? '2nd PLACE 🥈' : '3rd PLACE 🥉'}
                        </div>
                        <button
                            onClick={() => {
                                setGameState('start');
                                setPosition(0);
                            }}
                            className="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            RACE AGAIN
                        </button>
                        <button
                            onClick={onExit}
                            className="mt-4 text-slate-400 hover:text-white transition-colors"
                        >
                            Exit to Games
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
