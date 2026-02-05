import React from 'react';
import { usePlane } from '@react-three/cannon';

export function Terrain({ type }: { type?: string }) {
    const color = {
        grass: '#15803d',
        snow: '#f8fafc',
        sand: '#fde047',
        concrete: '#475569',
        dirt: '#78350f',
        water: '#0369a1'
    }[type || 'grass'];

    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -0.5, 0],
        type: 'Static'
    }));
    
    return (
        <group>
            <mesh ref={ref as any} receiveShadow>
                <planeGeometry args={[10000, 10000]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={type === 'water' ? 0.1 : 0.8} 
                    metalness={type === 'water' ? 0.4 : 0.1}
                    transparent={type === 'water'}
                    opacity={type === 'water' ? 0.8 : 1}
                />
            </mesh>
            {type === 'water' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
                    <planeGeometry args={[10000, 10000]} />
                    <meshStandardMaterial color="#0c4a6e" />
                </mesh>
            )}
        </group>
    );
}
