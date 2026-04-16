import { describe, expect, it } from 'vitest';
import { createParticle } from '../data/presets';
import { advanceSimulation, initialiseSimulation } from './physics';
import type { Fields } from './types';

describe('physics engine', () => {
  it('keeps kinetic energy nearly constant in a magnetic field only', () => {
    const particle = createParticle('electron', 0);
    const fields: Fields = {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 3 },
      density: 3,
      scaleMode: 'teaching',
    };
    const initial = initialiseSimulation([{ ...particle, velocity: { x: 2.4, y: 0, z: 0 } }], fields);
    const final = advanceSimulation(initial, fields, 2, 180);

    expect(final.particles[0].kineticEnergy).toBeCloseTo(
      initial.particles[0].kineticEnergy,
      3,
    );
  });

  it('accelerates particles along the electric field', () => {
    const particle = createParticle('proton', 1);
    const fields: Fields = {
      electric: { x: 2, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 0 },
      density: 3,
      scaleMode: 'teaching',
    };
    const initial = initialiseSimulation([{ ...particle, velocity: { x: 0, y: 0, z: 0 } }], fields);
    const final = advanceSimulation(initial, fields, 1, 180);

    expect(final.particles[0].velocity.x).toBeGreaterThan(0);
    expect(final.particles[0].position.x).toBeGreaterThan(initial.particles[0].position.x);
  });

  it('records trail points for adaptive substeps within a frame', () => {
    const particle = createParticle('electron', 0);
    const fields: Fields = {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 3 },
      density: 3,
      scaleMode: 'teaching',
    };
    const initial = initialiseSimulation([{ ...particle, velocity: { x: 2.4, y: 0, z: 0 } }], fields);
    const final = advanceSimulation(initial, fields, 0.1, 180);

    expect(final.particles[0].trail.length).toBeGreaterThan(2);
  });
});
