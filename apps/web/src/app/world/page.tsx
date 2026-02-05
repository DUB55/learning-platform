'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    PointerLockControls, 
    Sky, 
    Environment, 
    Stars, 
    PerspectiveCamera,
    KeyboardControls,
    useKeyboardControls,
    Box,
    Plane,
    Text,
    Float,
    ContactShadows
} from '@react-three/drei';
import { Physics, useSphere, useBox, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Move, MousePointer2, Info } from 'lucide-react';

// Player Movement Component
function Player() {
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position: [0, 2, 10],
        args: [1]
    }));

    const velocity = useRef([0, 0, 0]);
    useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

    const pos = useRef([0, 0, 0]);
    useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

    const [, getKeys] = useKeyboardControls();
    const { camera } = useThree();

    useFrame(() => {
        const { forward, backward, left, right, jump } = getKeys();

        const direction = new THREE.Vector3();
        const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
        const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);

        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(10)
            .applyEuler(camera.rotation);

        api.velocity.set(direction.x, velocity.current[1], direction.z);

        if (jump && Math.abs(velocity.current[1]) < 0.05) {
            api.velocity.set(velocity.current[0], 5, velocity.current[2]);
        }

        camera.position.copy(new THREE.Vector3(pos.current[0], pos.current[1] + 1.5, pos.current[2]));
    });

    return (
        <mesh ref={ref as any}>
            <sphereGeometry args={[1]} />
            <meshStandardMaterial opacity={0} transparent />
        </mesh>
    );
}

// Building Component
function Building({ position, args, color }: { position: [number, number, number], args: [number, number, number], color: string }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args
    }));

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
    );
}

// Floor Component
function Ground() {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0]
    }));

    return (
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <meshStandardMaterial color="#111827" roughness={0.8} />
        </mesh>
    );
}

// Floating Info Panel
function FloatingInfo({ position, text }: { position: [number, number, number], text: string }) {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <Text
                position={position}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={5}
            >
                {text}
            </Text>
        </Float>
    );
}

function City() {
    // Generate random buildings
    const buildings = [];
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        const h = 5 + Math.random() * 20;
        const w = 4 + Math.random() * 6;
        const d = 4 + Math.random() * 6;
        buildings.push({
            position: [x, h / 2, z] as [number, number, number],
            args: [w, h, d] as [number, number, number],
            color: `hsl(${200 + Math.random() * 40}, 70%, ${20 + Math.random() * 30}%)`
        });
    }

    return (
        <>
            {buildings.map((b, i) => (
                <Building key={i} {...b} />
            ))}
            
            {/* Some specific educational landmarks */}
            <Building position={[0, 5, -20]} args={[15, 10, 10]} color="#3b82f6" />
            <FloatingInfo position={[0, 12, -20]} text="The AI Academy\nExplore the Future" />

            <Building position={[20, 8, 20]} args={[10, 16, 10]} color="#a855f7" />
            <FloatingInfo position={[20, 18, 20]} text="Skill Library\nMaster Your Craft" />

            <Building position={[-25, 4, 15]} args={[12, 8, 12]} color="#10b981" />
            <FloatingInfo position={[-25, 10, 15]} text="Social Hub\nLearn Together" />
        </>
    );
}

export default function WorldPage() {
    const [isLocked, setIsLocked] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);

    return (
        <div className="w-full h-screen bg-[#020617] relative overflow-hidden">
            <KeyboardControls
                map={[
                    { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
                    { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
                    { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
                    { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
                    { name: 'jump', keys: ['Space'] },
                ]}
            >
                <Canvas shadows>
                    <Suspense fallback={null}>
                        <PerspectiveCamera makeDefault fov={75} position={[0, 2, 10]} />
                        <Sky sunPosition={[100, 20, 100]} />
                        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                        <Environment preset="night" />
                        
                        <ambientLight intensity={0.4} />
                        <pointLight position={[10, 10, 10]} castShadow />
                        <directionalLight 
                            position={[50, 50, 50]} 
                            castShadow 
                            shadow-camera-left={-50}
                            shadow-camera-right={50}
                            shadow-camera-top={50}
                            shadow-camera-bottom={-50}
                        />

                        <Physics gravity={[0, -9.81, 0]}>
                            <Player />
                            <Ground />
                            <City />
                        </Physics>

                        <PointerLockControls 
                            onLock={() => setIsLocked(true)} 
                            onUnlock={() => setIsLocked(false)} 
                        />
                        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={100} blur={1} far={10} />
                    </Suspense>
                </Canvas>
            </KeyboardControls>

            {/* UI Overlays */}
            <AnimatePresence>
                {!isLocked && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MousePointer2 className="w-10 h-10 text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Welcome to the Learning City</h2>
                            <p className="text-slate-400 mb-8">
                                Experience an immersive 3D world where knowledge comes to life. Walk through streets of information and explore interactive landmarks.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                                    <Move className="w-6 h-6 text-purple-400 mb-2" />
                                    <span className="text-xs text-slate-500">WASD / ARROWS</span>
                                    <span className="text-sm text-white font-medium">To Move</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                                    <div className="w-6 h-6 rounded border border-purple-400 flex items-center justify-center text-[10px] text-purple-400 font-bold mb-2">SPACE</div>
                                    <span className="text-xs text-slate-500">SPACE BAR</span>
                                    <span className="text-sm text-white font-medium">To Jump</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => {}} 
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                            >
                                CLICK ANYWHERE TO START
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD */}
            {isLocked && (
                <div className="absolute top-8 left-8 flex items-center gap-4 z-10">
                    <div className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-white font-medium">Immersive Session Active</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-8 right-8 z-10">
                <button 
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all"
                >
                    <Info className="w-6 h-6" />
                </button>
            </div>

            <AnimatePresence>
                {showInstructions && (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute bottom-24 right-8 max-w-xs bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl z-10"
                    >
                        <h4 className="text-white font-bold mb-2">Controls</h4>
                        <ul className="text-sm text-slate-400 space-y-2">
                            <li>• WASD to walk around</li>
                            <li>• Mouse to look</li>
                            <li>• Space to jump</li>
                            <li>• ESC to release mouse</li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
