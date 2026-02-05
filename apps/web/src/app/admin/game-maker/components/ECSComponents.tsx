import { useFrame } from '@react-three/fiber';
import { PublicApi } from '@react-three/cannon';
import { GameComponent } from '../types';

export function MovementComponent({ api, component }: { api: PublicApi, component: GameComponent }) {
    useFrame((state) => {
        if (!component.enabled) return;

        const { pattern, speed = 2, distance = 5 } = component.props;
        const t = state.clock.getElapsedTime();

        if (pattern === 'patrol') {
            const x = Math.sin(t * speed) * distance;
            api.position.set(x, 0, 0); // Vereenvoudigd voorbeeld
        } else if (pattern === 'float') {
            const y = Math.sin(t * speed) * 0.5 + 2;
            api.position.set(0, y, 0);
        }
    });

    return null;
}

export function AIComponent({ api, component }: { api: PublicApi, component: GameComponent }) {
    useFrame((state) => {
        if (!component.enabled) return;
        // AI logica (bijv. volgen van speler)
    });
    return null;
}

export function InteractionComponent({ component }: { component: GameComponent }) {
    // Voor visualisatie van de interactieradius in de editor
    if (!component.enabled) return null;

    const { radius = 2 } = component.props;

    return (
        <mesh>
            <sphereGeometry args={[radius, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.1} />
        </mesh>
    );
}
