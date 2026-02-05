import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Environment, Stars, Grid, ContactShadows } from '@react-three/drei';
import { Physics, Debug } from '@react-three/cannon';
import * as THREE from 'three';
import { GameDesign, GameObject } from '../types';
import { WeatherSystem } from './WeatherSystem';
import { Terrain } from './Terrain';
import { Object3D } from './Object3D';
import Effects from './Effects';

export function Scene3D({ game, setGame, selectedId, setSelectedId, transformMode, addToHistory }: { 
    game: GameDesign, 
    setGame: React.Dispatch<React.SetStateAction<GameDesign>>, 
    selectedId: string | null, 
    setSelectedId: (id: string | null) => void,
    transformMode: 'translate' | 'rotate' | 'scale',
    addToHistory: (game: GameDesign) => void
}) {
    const { camera, scene } = useThree();
    const orbitRef = useRef<any>(null);
    const [currentTime, setCurrentTime] = useState(game.settings.timeOfDay || 12);

    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(false);

    const onUpdate = (updates: Partial<GameObject>, isFinished: boolean = false) => {
        if (!selectedId) return;
        
        // Apply snapping if enabled
        if (snapToGrid && updates.x !== undefined) updates.x = Math.round(updates.x / 50) * 50;
        if (snapToGrid && updates.y !== undefined) updates.y = Math.round(updates.y / 50) * 50;
        if (snapToGrid && updates.z !== undefined) updates.z = Math.round(updates.z / 50) * 50;

        const updatedGame = {
            ...game,
            objects: game.objects.map(obj => 
                obj.id === selectedId ? { ...obj, ...updates } : obj
            )
        };
        setGame(updatedGame);

        if (isFinished) {
            addToHistory(updatedGame);
        }
    };

    // Focus function (Blender-like 'F' key)
    const focusOnSelected = () => {
        if (!selectedId || !orbitRef.current) return;
        
        const selectedObj = game.objects.find(o => o.id === selectedId);
        if (!selectedObj) return;

        const target = new THREE.Vector3(selectedObj.x, selectedObj.y, selectedObj.z || 0);
        
        // Smoothly animate orbit target
        orbitRef.current.target.lerp(target, 0.1);
        
        // Also move camera closer if too far
        const dist = camera.position.distanceTo(target);
        if (dist > 1000) {
            const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
            camera.position.copy(target).add(direction.multiplyScalar(500));
        }
    };

    // Handle shortcuts inside the scene
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const key = e.key.toLowerCase();

            if (key === 'f') {
                focusOnSelected();
            }
            if (key === 'n' && e.altKey) {
                setShowGrid(prev => !prev);
            }
            if (key === 'b' && e.altKey) {
                setSnapToGrid(prev => !prev);
            }

            // Blender-like Reset Transforms
            if (e.altKey && selectedId) {
                if (key === 'g') {
                    onUpdate({ x: 0, y: 0, z: 0 }, true);
                }
                if (key === 'r') {
                    onUpdate({ rotation: [0, 0, 0] }, true);
                }
                if (key === 's') {
                    onUpdate({ width: 40, height: 40, depth: 40 }, true);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, game.objects, snapToGrid]);

    // Update camera position based on distance setting
    useEffect(() => {
        if (game.settings.cameraDistance && !selectedId) {
            camera.position.set(game.settings.cameraDistance, game.settings.cameraDistance, game.settings.cameraDistance);
            camera.lookAt(0, 0, 0);
        }
    }, [game.settings.cameraDistance, camera, selectedId]);

    useFrame((state, delta) => {
        if (game.settings.dayNightCycle) {
            setCurrentTime(prev => (prev + delta * 0.1) % 24);
        }
        
        // Continuous smooth lerp for focus if needed
        if (selectedId && orbitRef.current) {
            // Optional: always keep target on selected? (maybe too aggressive)
        }
    });

    // Update global game state occasionally or when cycle stops
    useEffect(() => {
        if (game.settings.dayNightCycle) {
            const timer = setInterval(() => {
                setGame(prev => ({ ...prev, settings: { ...prev.settings, timeOfDay: currentTime } }));
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [game.settings.dayNightCycle, currentTime]);

    const sunPosition: [number, number, number] = [
        Math.cos((currentTime / 24) * Math.PI * 2) * 500,
        Math.sin((currentTime / 24) * Math.PI * 2) * 500,
        200
    ];

    return (
        <group onPointerMissed={() => setSelectedId(null)}>
            <OrbitControls 
                ref={orbitRef}
                makeDefault 
                enableDamping 
                dampingFactor={0.05} 
                rotateSpeed={0.5}
                panSpeed={0.8}
                screenSpacePanning={true}
            />
            <PerspectiveCamera 
                makeDefault 
                position={[500, 500, 500]} 
                far={10000} 
                fov={game.settings.cameraMode === 'firstPerson' ? 90 : 50}
            />
            
            {/* Environment */}
            <Sky 
                sunPosition={sunPosition} 
                inclination={currentTime / 24} 
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
                rayleigh={3}
                turbidity={10}
            />
            <Environment preset={(game.settings.skybox as any) || 'sunset'} />
            <Stars 
                radius={100} 
                depth={50} 
                count={5000} 
                factor={4} 
                saturation={0} 
                fade 
                speed={1} 
                opacity={currentTime > 18 || currentTime < 6 ? 1 : 0}
            />
            <ambientLight intensity={game.settings.ambientLightIntensity || (currentTime > 18 || currentTime < 6 ? 0.2 : 0.5)} />
            <directionalLight position={sunPosition} castShadow intensity={currentTime > 18 || currentTime < 6 ? 0.1 : 1} />
            
            <WeatherSystem type={game.settings.weather} />
            
            <Physics gravity={[0, -9.81, 0]} tolerance={0.001}>
                <Debug color="white" scale={1.1}>
                    <Terrain type={game.settings.groundType} />
                    
                    {game.objects.map((obj) => (
                        <Object3D 
                            key={obj.id} 
                            obj={obj} 
                            isSelected={selectedId === obj.id}
                            onSelect={() => setSelectedId(obj.id)}
                            onUpdate={onUpdate}
                            transformMode={transformMode}
                        />
                    ))}
                </Debug>
            </Physics>
            
            {game.settings.fogDensity && game.settings.fogDensity > 0 && (
                <fogExp2 attach="fog" color={game.settings.fogColor || '#000'} density={game.settings.fogDensity} />
            )}
            
            {showGrid && (
                <Grid 
                    infiniteGrid 
                    fadeDistance={2000} 
                    fadeStrength={5} 
                    cellSize={100} 
                    sectionSize={500} 
                    sectionColor="#3b82f6" 
                    cellColor="#1e293b" 
                />
            )}

            <ContactShadows position={[0, -0.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
            <Effects game={game} />
        </group>
    );
}
