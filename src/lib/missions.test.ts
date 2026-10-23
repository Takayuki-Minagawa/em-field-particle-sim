import { describe, expect, it } from 'vitest';
import { createScenarioParticles, defaultFields } from '../data/presets';
import { lessons } from '../data/lessons';
import { exbDrift, missions, type Mission } from './missions';
import { advanceSimulation, initialiseSimulation } from './physics';
import type { Fields, ScenarioSetup } from './types';

function fieldsFor(setup: ScenarioSetup): Fields {
  return { ...defaultFields, electric: { ...setup.electric }, magnetic: { ...setup.magnetic } };
}

function play(mission: Mission, setup: ScenarioSetup = mission.setup, duration = 24) {
  const fields = fieldsFor(setup);
  let state = initialiseSimulation(createScenarioParticles(setup, 0), fields);

  while (state.time < duration) {
    state = advanceSimulation(state, fields, 0.05, 150);
    const status = mission.evaluate({
      particle: state.particles[0],
      fields: state.fields,
      time: state.time,
      language: 'en',
    });
    if (status.complete) {
      return true;
    }
  }

  return false;
}

function mission(id: string) {
  const found = missions.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`missing mission ${id}`);
  }
  return found;
}

function withParticle(setup: ScenarioSetup, patch: Partial<ScenarioSetup['particles'][number]>) {
  return { ...setup, particles: [{ ...setup.particles[0], ...patch }] };
}

describe('missions', () => {
  it('cannot be cleared with the starting setup', () => {
    for (const entry of missions) {
      expect(play(entry), entry.id).toBe(false);
    }
  });

  it('clears the electric rocket with a stronger field', () => {
    const entry = mission('accelerate');
    expect(play(entry, { ...entry.setup, electric: { x: 1.2, y: 0, z: 0 } })).toBe(true);
  });

  it('clears the parabolic shot with a faster launch', () => {
    const entry = mission('deflect');
    expect(play(entry, withParticle(entry.setup, { velocity: { x: 2.4, y: 0, z: 0 } }))).toBe(true);
  });

  it('clears the radius mission by doubling the speed', () => {
    const entry = mission('circle');
    expect(play(entry, withParticle(entry.setup, { velocity: { x: 2, y: 0, z: 0 } }))).toBe(true);
  });

  it('clears the helix mission by adding velocity along B', () => {
    const entry = mission('helix');
    expect(play(entry, withParticle(entry.setup, { velocity: { x: 2, y: 0, z: 0.8 } }))).toBe(true);
  });

  it('clears the gate only at v = E / B', () => {
    const entry = mission('selector');
    expect(play(entry, withParticle(entry.setup, { velocity: { x: 2, y: 0, z: 0 } }))).toBe(true);
    expect(play(entry, withParticle(entry.setup, { velocity: { x: 2.5, y: 0, z: 0 } }))).toBe(false);
  });

  it('clears the drift mission by flipping B but not by flipping the charge', () => {
    const entry = mission('drift');
    expect(play(entry, { ...entry.setup, magnetic: { x: 0, y: 0, z: -1.5 } })).toBe(true);
    expect(play(entry, withParticle(entry.setup, { charge: 1 }))).toBe(false);
  });

  it('rejects shortcuts that bypass what each mission teaches', () => {
    const accelerate = mission('accelerate');
    expect(play(accelerate, { ...accelerate.setup, electric: { x: -1.5, y: 0, z: 0 } })).toBe(false);

    const deflect = mission('deflect');
    expect(play(deflect, withParticle(deflect.setup, { position: { x: 2, y: -3, z: 0 } }))).toBe(false);

    const selector = mission('selector');
    expect(play(selector, withParticle(selector.setup, { charge: 0 }))).toBe(false);

    const drift = mission('drift');
    expect(
      play(
        drift,
        withParticle(
          { ...drift.setup, electric: { x: 0, y: -1.5, z: 0 } },
          { position: { x: -2, y: 0, z: 0 } },
        ),
        2,
      ),
    ).toBe(false);
  });

  it('computes the E x B drift independent of charge', () => {
    expect(exbDrift({ ...defaultFields, electric: { x: 0, y: 1.5, z: 0 }, magnetic: { x: 0, y: 0, z: 1.5 } }))
      .toEqual({ x: 1, y: 0, z: 0 });
  });
});

describe('lessons', () => {
  it('lists valid prediction answers', () => {
    for (const lesson of lessons) {
      const ids = lesson.prediction.options.map((option) => option.id);
      expect(ids, lesson.id).toContain(lesson.prediction.correctId);
      expect(lesson.setup.particles.length, lesson.id).toBeGreaterThan(0);
    }
  });

  it('shows only the v = E / B particle going straight in the selector lesson', () => {
    const lesson = lessons.find((entry) => entry.id === 'velocity-selector')!;
    const fields = fieldsFor(lesson.setup);
    const state = advanceSimulation(
      initialiseSimulation(createScenarioParticles(lesson.setup, 0), fields),
      fields,
      3,
      150,
    );
    const [slow, middle, fast] = state.particles;

    expect(slow.position.y).toBeGreaterThan(0.2);
    expect(Math.abs(middle.position.y)).toBeLessThan(0.01);
    expect(fast.position.y).toBeLessThan(-0.2);
  });
});
