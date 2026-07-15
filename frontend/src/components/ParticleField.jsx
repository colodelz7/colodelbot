import { useRef } from 'react';
import { useParticleField } from '../hooks/useParticleField';

export default function ParticleField() {
  const ref = useRef(null);
  useParticleField(ref);
  return (
    <>
      <canvas className="particle-field" ref={ref} aria-hidden="true"></canvas>
      <div className="bg-glow" aria-hidden="true"></div>
    </>
  );
}
