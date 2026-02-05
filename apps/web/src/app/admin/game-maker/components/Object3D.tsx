import React, { useRef, useEffect } from 'react';
import { TransformControls, Text } from '@react-three/drei';
import { useBox, useSphere, useCylinder } from '@react-three/cannon';
import * as THREE from 'three';
import { GameObject } from '../types';
import { Model } from './Model';
import { MovementComponent, AIComponent, InteractionComponent } from './ECSComponents';

export function Object3D({ obj, isSelected, onSelect, onUpdate, transformMode }: { 
    obj: GameObject, 
    isSelected: boolean, 
    onSelect: () => void,
    onUpdate: (updates: Partial<GameObject>, isFinished?: boolean) => void,
    transformMode: 'translate' | 'rotate' | 'scale'
}) {

    // Physics configuration
    const physicsComp = obj.components?.find(c => c.type === 'physics');
    const isStatic = obj.properties.isStatic || obj.properties.static || !physicsComp;
    const mass = physicsComp?.props.mass ?? obj.properties.mass ?? (isStatic ? 0 : 1);
    
    const position: [number, number, number] = [obj.x, obj.y, obj.z || 0];
    const rotation: [number, number, number] = obj.rotation || [0, 0, 0];
    const scale: [number, number, number] = [obj.width / 40, obj.height / 40, (obj.depth || 40) / 40];

    const meshRef = useRef<THREE.Mesh>(null);

    // Select physics hook based on shape
    const physicsConfig = {
        mass,
        position,
        rotation,
        type: (isStatic ? 'Static' : 'Dynamic') as any,
        args: scale,
    };

    // Determine shape
    let shape = 'box';
    if (obj.type === 'coin' || obj.type === 'barrel') shape = 'cylinder';
    if (obj.type === 'player') shape = 'sphere'; // Simplified for physics
    if (obj.type === 'rock') shape = 'sphere';

    const [boxRef, boxApi] = useBox(() => ({ ...physicsConfig }), meshRef);
    const [sphereRef, sphereApi] = useSphere(() => ({ ...physicsConfig, args: [obj.width / 40] }), meshRef);
    const [cylinderRef, cylinderApi] = useCylinder(() => ({ 
        ...physicsConfig, 
        args: [obj.width / 40, obj.width / 40, obj.height / 40, 16] 
    }), meshRef);

    // Use the appropriate API and Ref
    const api = shape === 'sphere' ? sphereApi : shape === 'cylinder' ? cylinderApi : boxApi;
    const physicsRef = shape === 'sphere' ? sphereRef : shape === 'cylinder' ? cylinderRef : boxRef;

    // Sync physics body with manual transforms in editor
    useEffect(() => {
        if (isSelected) {
            api.position.set(obj.x, obj.y, obj.z || 0);
            api.rotation.set(rotation[0], rotation[1], rotation[2]);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
        }
    }, [obj.x, obj.y, obj.z, rotation, isSelected, api]);

    const handleTransform = (e: any) => {
        if (!physicsRef.current) return;
        const { position, rotation, scale } = physicsRef.current;
        
        // Update the game state
        onUpdate({
            x: position.x,
            y: position.y,
            z: position.z,
            width: scale.x * 40,
            height: scale.y * 40,
            depth: scale.z * 40,
            rotation: [rotation.x, rotation.y, rotation.z]
        }, true); // Mark as finished for history

        // Update physics body immediately
        api.position.set(position.x, position.y, position.z);
        api.rotation.set(rotation.x, rotation.y, rotation.z);
    };

    const getGeometry = () => {
        if (obj.type === 'model' && obj.properties.modelUrl) {
            return <Model url={obj.properties.modelUrl} color={obj.color} />;
        }

        switch (obj.type) {
            case 'player': return <capsuleGeometry args={[obj.width/2, obj.height, 4, 8]} />;
            case 'enemy': return <boxGeometry args={[obj.width, obj.height, obj.depth || 40]} />;
            case 'coin': return <cylinderGeometry args={[obj.width/2, obj.width/2, 5, 32]} rotation={[Math.PI/2, 0, 0]} />;
            case 'goal': return <torusGeometry args={[obj.width/2, 5, 16, 100]} />;
            case 'light': return <sphereGeometry args={[5, 16, 16]} />;
            default: return <boxGeometry args={[obj.width, obj.height, obj.depth || 40]} />;
        }
    };

    if (obj.visible === false) return null;

    return (
        <group>
            {isSelected && (
                <mesh position={position} rotation={rotation}>
                    <boxGeometry args={[obj.width + 2, obj.height + 2, (obj.depth || 40) + 2]} />
                    <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.3} />
                </mesh>
            )}
            <mesh
                ref={physicsRef as any}
                name={obj.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                castShadow
                receiveShadow
            >
                {obj.type === 'model' && obj.properties.modelUrl ? (
                    <Model url={obj.properties.modelUrl} color={obj.color} />
                ) : (
                    <>
                        {getGeometry()}
                        <meshStandardMaterial 
                            color={obj.color} 
                            emissive={obj.type === 'light' ? obj.color : '#000'}
                            emissiveIntensity={obj.type === 'light' ? 2 : 0}
                            transparent={obj.type === 'trigger'}
                            opacity={obj.type === 'trigger' ? 0.3 : 1}
                        />
                    </>
                )}

                {obj.type === 'light' && (
                    <group>
                        {obj.properties.type === 'directional' ? (
                            <directionalLight 
                                intensity={obj.properties.intensity || 1} 
                                color={obj.color} 
                                castShadow
                            />
                        ) : obj.properties.type === 'spot' ? (
                            <spotLight 
                                intensity={obj.properties.intensity || 1} 
                                color={obj.color} 
                                angle={0.3}
                                penumbra={1}
                                castShadow
                            />
                        ) : (
                            <pointLight 
                                intensity={obj.properties.intensity || 1} 
                                color={obj.color} 
                                distance={obj.properties.range || 500}
                                castShadow
                            />
                        )}
                    </group>
                )}

                <Text
                    position={[0, 40, 0]}
                    fontSize={12}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    visible={isSelected}
                    scale={[40 / obj.width, 40 / obj.height, 40 / (obj.depth || 40)]}
                >
                    {obj.type}
                </Text>
            </mesh>

            {/* ECS Components */}
            {obj.components?.map(comp => (
                <React.Fragment key={comp.id}>
                    {comp.type === 'movement' && <MovementComponent api={api} component={comp} />}
                    {comp.type === 'ai' && <AIComponent api={api} component={comp} />}
                    {comp.type === 'interaction' && <InteractionComponent component={comp} />}
                </React.Fragment>
            ))}
            
            {isSelected && (
                <TransformControls 
                    object={physicsRef.current as any} 
                    onMouseUp={handleTransform}
                    mode={transformMode}
                />
            )}
        </group>
    );
}
