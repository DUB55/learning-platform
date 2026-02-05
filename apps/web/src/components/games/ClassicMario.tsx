'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, KeyboardControls, useKeyboardControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Ghost, Play, RotateCcw, Flag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const GRAVITY = 20;
const SPEED = 8;
const JUMP_FORCE = 10;

function Player({ isPlaying, onFinish, onDie }: { isPlaying: boolean, onFinish: () => void, onDie: () => void }) {
    const mesh = useRef<THREE.Group>(null);
    const velocity = useRef(new THREE.Vector3());
    const [, getKeys] = useKeyboardControls();

    // Simple level data collision check
    // Ground is y=0. Platforms at y=2, y=4 etc.
    const checkGrounded = (pos: THREE.Vector3): boolean => {
        // Floor 
        if (pos.y <= 0.6) return true;
        // Platform 1: x[5..15] y=2
        if (pos.y <= 2.6 && pos.y >= 2.0 && pos.x > 5 && pos.x < 15) return true;
        // Platform 2: x[20..25] y=4
        if (pos.y <= 4.6 && pos.y >= 4.0 && pos.x > 20 && pos.x < 25) return true;
        return false;
    };

    useFrame((state, delta) => {
        if (!isPlaying || !mesh.current) return;

        const { left, right, jump } = getKeys();

        // Horizontal Movement
        if (right) velocity.current.x = SPEED;
        else if (left) velocity.current.x = -SPEED;
        else velocity.current.x = 0;

        // Vertical Movement (Gravity)
        velocity.current.y -= GRAVITY * delta;

        // Apply
        mesh.current.position.x += velocity.current.x * delta;
        mesh.current.position.y += velocity.current.y * delta;

        // Collision / Grounding
        if (checkGrounded(mesh.current.position)) {
            velocity.current.y = 0;
            // Snap to surface? Simplified: if sinking, push up
            if (mesh.current.position.y < 0.5) mesh.current.position.y = 0.5;
            // Plat 1
            if (mesh.current.position.y < 2.5 && mesh.current.position.y > 1.9 && mesh.current.position.x > 5 && mesh.current.position.x < 15) mesh.current.position.y = 2.5;
            // Plat 2
            if (mesh.current.position.y < 4.5 && mesh.current.position.y > 3.9 && mesh.current.position.x > 20 && mesh.current.position.x < 25) mesh.current.position.y = 4.5;

            // Jump
            if (jump) {
                velocity.current.y = JUMP_FORCE;
            }
        }

        // Death (Pit)
        if (mesh.current.position.y < -5) {
            onDie();
        }

        // Win
        if (mesh.current.position.x > 45) {
            onFinish();
        }
    });

    return (
        <group ref={mesh} position={[0, 0.5, 0]}>
            <mesh castShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#f97316" />
            </mesh>
            <mesh position={[0.2, 0.2, 0.5]}>
                <boxGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
}

function Level() {
    return (
        <group>
            {/* Ground */}
            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[10, 1, 4]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>
            <mesh position={[25, -0.5, 0]}>
                <boxGeometry args={[40, 1, 4]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>

            {/* Platforms */}
            <mesh position={[10, 2, 0]} castShadow>
                <boxGeometry args={[10, 0.5, 2]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>

            <mesh position={[22.5, 4, 0]} castShadow>
                <boxGeometry args={[5, 0.5, 2]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>

            {/* Flag Pole (Goal) */}
            <group position={[45, 0, 0]}>
                <mesh position={[0, 2.5, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 5]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0.5, 4.5, 0]}>
                    <boxGeometry args={[1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
            </group>
        </group>
    );
}

function GameScene({ isPlaying, onFinish, onDie }: any) {
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const playerRef = useRef(new THREE.Vector3());

    useFrame(() => {
        if (cameraRef.current) {
            // Camera follows player X
            // We can't access player ref directly easily here without Context, 
            // so we cheat and use a global or assume player sets camera? 
            // Better: Player updates camera? No, separate concerns.
            // Let's just make the camera move independently or have Player act as camera parent?
            // R3F CameraControls is best. But for simple follow:
            // Actually, let's just make the camera a child of the player?
            // Or simplified: Just fixed camera for this MVP?
            // We want scrolling.
            // Let's implement a 'FollowCamera' inside Player?
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 20, 10]} intensity={1} castShadow />
            <Sky sunPosition={[10, 10, 0]} />
            <Level />
            <Player
                isPlaying={isPlaying}
                onFinish={onFinish}
                onDie={onDie}
            />
            {/* Camera is handled inside Player or separately? Let's use a follow cam component */}
            <FollowCam />
        </>
    );
}

function FollowCam() {
    useFrame((state) => {
        const { camera, scene } = state;
        const player = scene.children.find(c => c.type === 'Group' && c.children[0]?.type === 'Group'); // Better find player
        if (player) {
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x, 0.1);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, player.position.y + 2, 0.1);
            camera.lookAt(player.position.x, player.position.y, 0);
        }
    });
    return null;
}

export default function ClassicMario({ onExit, terms, focusMode }: { onExit?: () => void, terms?: any[], focusMode?: boolean } = {}) {
    const { updateXP } = useAuth();
    const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');

    const controls = useMemo(() => [
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space', 'ArrowUp', 'KeyW'] },
    ], []);

    return (
        <div className="relative w-full h-[600px] bg-sky-300 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 5, 10]} />
                <KeyboardControls map={controls}>
                    <GameScene
                        isPlaying={gameState === 'playing'}
                        onFinish={() => {
                            setGameState('won');
                            updateXP(50, 'Classic Mario - Level Complete');
                        }}
                        onDie={() => {
                            setGameState('lost');
                            updateXP(10, 'Classic Mario - Game Over (Effort reward)');
                        }}
                    />
                </KeyboardControls>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-auto">
                        <Ghost className="w-16 h-16 text-orange-400 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">SUPER JUMP</h1>
                        <p className="text-slate-300 mb-8">Reach the flag.</p>
                        <button onClick={() => setGameState('playing')} className="glass-button px-8 py-3 bg-orange-600 hover:bg-orange-500 rounded-full text-white font-bold flex gap-2 items-center">
                            <Play className="w-5 h-5 fill-current" /> START
                        </button>
                    </div>
                )}
                {gameState === 'won' && (
                    <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center pointer-events-auto">
                        <Flag className="w-16 h-16 text-yellow-500 mb-4" />
                        <h1 className="text-4xl font-bold text-white mb-2">LEVEL CLEARED!</h1>
                        <button onClick={() => setGameState('playing')} className="glass-button px-8 py-3 bg-white text-green-900 rounded-full font-bold flex gap-2 items-center hover:scale-105 transition-transform">
                            <RotateCcw className="w-5 h-5" /> REPLAY
                        </button>
                    </div>
                )}
                {gameState === 'lost' && (
                    <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center pointer-events-auto">
                        <h1 className="text-4xl font-bold text-white mb-2">YOU FELL!</h1>
                        <button onClick={() => setGameState('playing')} className="glass-button px-8 py-3 bg-white text-red-900 rounded-full font-bold flex gap-2 items-center hover:scale-105 transition-transform">
                            <RotateCcw className="w-5 h-5" /> RETRY
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
