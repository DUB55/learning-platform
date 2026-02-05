import { useFrame } from '@react-three/fiber';
import { GameDesign, GameObject } from '../types';

export function useGameLoop(
    game: GameDesign, 
    setGame: React.Dispatch<React.SetStateAction<GameDesign>>,
    isPlaying: boolean
) {
    useFrame((state, delta) => {
        if (!isPlaying) return;

        // Hier komt de centrale logica voor systeem-updates
        // Bijv. AI beslissingen, globale timers, etc.
        
        // We willen de state niet elke frame updaten via setGame (performance),
        // maar wel de refs van objecten manipuleren via hun API's.
    });
}
