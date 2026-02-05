import React from 'react';
import { useGLTF } from '@react-three/drei';

export function Model({ url, color }: { url: string, color: string }) {
    try {
        const { scene } = useGLTF(url);
        return <primitive object={scene.clone()} />;
    } catch (e) {
        return (
            <mesh>
                <boxGeometry args={[40, 40, 40]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>
        );
    }
}
