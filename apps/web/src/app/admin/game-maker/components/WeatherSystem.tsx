import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function WeatherSystem({ type }: { type?: string }) {
    const count = 2000;
    const [positions, velocities] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const vel = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 1000;
            pos[i * 3 + 1] = Math.random() * 1000;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 1000;
            vel[i] = 1 + Math.random() * 2;
        }
        return [pos, vel];
    }, [type]);

    const points = React.useRef<THREE.Points>(null);

    useFrame((state, delta) => {
        if (!points.current || type === 'none') return;
        const pos = points.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
            pos[i * 3 + 1] -= velocities[i] * (type === 'storm' ? 10 : 5);
            if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 1000;
        }
        points.current.geometry.attributes.position.needsUpdate = true;
    });

    if (!type || type === 'none' || type === 'sun') return null;

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={type === 'snow' ? 2 : 1}
                color={type === 'snow' ? '#fff' : '#7dd3fc'}
                transparent
                opacity={0.6}
            />
        </points>
    );
}
