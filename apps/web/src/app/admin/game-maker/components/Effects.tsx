'use client';

import { Bloom, EffectComposer, Noise, SSAO, Vignette } from '@react-three/postprocessing';
import { GameDesign } from '../types';

export default function Effects({ game }: { game: GameDesign }) {
  const rendering = game.settings.rendering;

  if (!rendering) return null;

  return (
    <EffectComposer disableNormalPass>
      {rendering.ssao?.enabled && (
        <SSAO 
          intensity={rendering.ssao.intensity || 1.5}
          radius={rendering.ssao.radius || 0.4}
          luminanceInfluence={0.5}
          color="black"
        />
      )}
      
      {rendering.bloom?.enabled && (
        <Bloom 
          intensity={rendering.bloom.intensity || 1.0}
          luminanceThreshold={rendering.bloom.threshold || 0.9}
          luminanceSmoothing={0.025}
          mipmapBlur
        />
      )}

      {rendering.vignette?.enabled && (
        <Vignette 
          offset={rendering.vignette.offset || 0.5}
          darkness={rendering.vignette.darkness || 0.5}
        />
      )}

      <Noise opacity={0.02} />
    </EffectComposer>
  );
}
