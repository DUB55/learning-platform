'use client';

// NOTE: User must install dependencies:
// npm install three @types/three @react-three/fiber @react-three/drei

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, KeyboardControls, PerspectiveCamera, Sky, Stars, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Crosshair, Shield, Play, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// --- Types ---
type Controls = {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
};

// --- Game Components ---

function Player({ isPlaying }: { isPlaying: boolean }) {
    const { camera } = useThree();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const [, getKeys] = useKeyboardControls();

    useFrame((state, delta) => {
        if (!isPlaying) return;

        // Simple WASD Movement Logic
        // In a real R3F game we'd use 'useKeyboardControls' from drei, but I'll use standard DOM listener in parent or simple check here
        // For robustness without checking version, let's use a simple global reference or ref passed down
        // ACTUALLY, KeyboardControls provides a context. I will use a simple custom hook logic here for safety

        // This is a simplified "Fly Mode" / "Walk Mode" without physics engine (Cannon/Rapier) to keep it dependency-light
        // Just moving camera position manually.

        const speed = 5.0;
        const keys = getKeys(); // { forward: true, ... }

        velocity.current.x -= velocity.current.x * 10.0 * delta;
        velocity.current.z -= velocity.current.z * 10.0 * delta;

        direction.current.z = Number(keys.forward) - Number(keys.backward);
        direction.current.x = Number(keys.right) - Number(keys.left); // Strafing reversed in Threejs sometimes?
        direction.current.normalize(); // Ensure constant speed

        if (keys.forward || keys.backward) velocity.current.z -= direction.current.z * 40.0 * delta;
        if (keys.left || keys.right) velocity.current.x -= direction.current.x * 40.0 * delta;

        // Apply
        camera.translateX(-velocity.current.x * delta * speed);
        camera.translateZ(velocity.current.z * delta * speed);

        // Lock Y (no flying)
        camera.position.y = 1.6;
    });

    return null;
}

function Wall({ position, size, rotation = [0, 0, 0], color = '#334155' }: { position: [number, number, number], size: [number, number, number], rotation?: [number, number, number], color?: string }) {
    return (
        <mesh position={position} rotation={rotation as any}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
    );
}

function EnemyBox({ position, isDead, onHit }: { position: [number, number, number], isDead: boolean, onHit: () => void }) {
    const mesh = useRef<THREE.Mesh>(null);

    return (
        <mesh
            ref={mesh}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onHit();
            }}
            visible={!isDead}
        >
            <boxGeometry args={[0.5, 1.8, 0.5]} />
            <meshStandardMaterial color="#ef4444" />
            {/* Head */}
            <mesh position={[0, 0.6, 0]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="#fca5a5" />
            </mesh>
        </mesh>
    );
}

function Level({ onEnemyHit, deadEnemies }: { onEnemyHit: (id: number) => void, deadEnemies: number[] }) {
    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#0f172a" opacity={0.5} transparent />
            </mesh>

            {/* Outer Walls */}
            <Wall position={[0, 2, -10]} size={[20, 4, 1]} />
            <Wall position={[0, 2, 10]} size={[20, 4, 1]} />
            <Wall position={[-10, 2, 0]} size={[1, 4, 20]} />
            <Wall position={[10, 2, 0]} size={[1, 4, 20]} />

            {/* Internal layout (The Drill) -- A simple maze/cover */}
            <Wall position={[-4, 1.5, -4]} size={[8, 3, 0.5]} />
            <Wall position={[4, 1.5, 2]} size={[8, 3, 0.5]} />
            <Wall position={[0, 1.5, 0]} size={[0.5, 3, 4]} />

            {/* Enemies */}
            {[1, 2, 3, 4, 5].map((id) => (
                <EnemyBox
                    key={id}
                    position={[
                        Math.sin(id) * 6, // Randomish positions
                        0.9,
                        Math.cos(id) * 6
                    ]}
                    isDead={deadEnemies.includes(id)}
                    onHit={() => onEnemyHit(id)}
                />
            ))}
        </group>
    );
}

// --- Main Component ---

export default function TacticalBreach({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'cleared'>('start');
    const [deadEnemies, setDeadEnemies] = useState<number[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const TOTAL_ENEMIES = 5;

    const handleEnemyHit = (id: number) => {
        if (gameState !== 'playing') return;
        if (!deadEnemies.includes(id)) {
            const newDead = [...deadEnemies, id];
            setDeadEnemies(newDead);
            if (newDead.length >= TOTAL_ENEMIES) {
                setGameState('cleared');
                updateXP(150);
            }
        }
    };

    const startGame = () => {
        setDeadEnemies([]);
        setGameState('playing');
    };

    const controlsMap = useMemo(() => [
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
    ], []);

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
        <div className="relative w-full h-[600px] bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <Canvas
                shadows
                dpr={[1, 2]}
                onCreated={({ gl }) => {
                    canvasRef.current = gl.domElement as HTMLCanvasElement;
                }}
            >
                <KeyboardControls map={controlsMap}>
                    <PerspectiveCamera makeDefault position={[0, 1.6, 8]} />
                    <PointerLockControls selector="#r6-overlay" />
                    <ambientLight intensity={0.2} />
                    <pointLight position={[2, 3, 2]} intensity={0.5} castShadow />
                    <Sky sunPosition={[100, 20, 100]} />

                    <Suspense fallback={null}>
                        <Level onEnemyHit={handleEnemyHit} deadEnemies={deadEnemies} />
                        <Player isPlaying={gameState === 'playing'} />
                    </Suspense>
                </KeyboardControls>
            </Canvas>

            {/* UI Overlay */}
            <div id="r6-overlay" className="absolute inset-0 pointer-events-none">
                {/* Exit Button */}
                <div className="absolute top-8 right-8 flex gap-4 pointer-events-auto">
                    <button
                        onClick={onExit}
                        className="glass-card p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <Home className="w-6 h-6" />
                    </button>
                </div>

                {/* HUD */}
                <div className="absolute bottom-8 left-8 flex gap-4">
                    <div className="glass-card p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-white/10">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">OPERATOR</div>
                            <div className="font-bold text-white">RECRUIT</div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="text-xs text-slate-400">ENEMIES REMAINING</div>
                        <div className="text-2xl font-mono font-bold text-red-400">
                            {TOTAL_ENEMIES - deadEnemies.length}
                        </div>
                    </div>
                </div>

                {/* Crosshair */}
                {gameState === 'playing' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Crosshair className="w-4 h-4 text-white opacity-80" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-white/30" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white/30" />
                    </div>
                )}

                {/* Start Screen */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
                        <Shield className="w-16 h-16 text-slate-400 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">TACTICAL BREACH</h1>
                        <p className="text-slate-400 mb-8 max-w-sm text-center">
                            Clear the killhouse. Neutralize all targets.
                            <br /><span className="text-xs mt-2 block">(WASD to Move, Click to Shoot)</span>
                        </p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-bold tracking-widest hover:scale-105 transition-transform"
                        >
                            INITIATE
                        </button>
                    </div>
                )}

                {/* Cleared Screen */}
                {gameState === 'cleared' && (
                    <div className="absolute inset-0 bg-blue-900/90 flex flex-col items-center justify-center pointer-events-auto">
                        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">AREA SECURE</h2>
                        <div className="text-2xl text-blue-200 mb-8">All tangos neutralized.</div>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-white text-blue-900 hover:bg-slate-200 rounded-sm font-bold tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            RE-RUN DRILL
                        </button>
                        <button
                            onClick={onExit}
                            className="mt-4 text-slate-400 hover:text-white transition-colors pointer-events-auto"
                        >
                            Exit to Games
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
