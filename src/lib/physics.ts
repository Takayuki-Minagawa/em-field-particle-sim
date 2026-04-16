import type {
  Fields,
  MetricPoint,
  ParticleConfig,
  ParticleState,
  SimulationState,
  Vector3,
} from './types';
import {
  EPSILON,
  add,
  clamp,
  cross,
  dot,
  magnitude,
  project,
  scale,
} from './vector';

const HISTORY_LIMIT = 220;

export function lorentzForce(
  charge: number,
  velocity: Vector3,
  fields: Fields,
): Vector3 {
  return scale(add(fields.electric, cross(velocity, fields.magnetic)), charge);
}

export function cyclotronPeriod(
  mass: number,
  charge: number,
  magneticFieldMagnitude: number,
): number | null {
  if (Math.abs(charge) < EPSILON || magneticFieldMagnitude < EPSILON) {
    return null;
  }

  return (2 * Math.PI * mass) / (Math.abs(charge) * magneticFieldMagnitude);
}

export function cyclotronRadius(
  mass: number,
  charge: number,
  velocity: Vector3,
  magnetic: Vector3,
): number | null {
  const magneticFieldMagnitude = magnitude(magnetic);
  if (Math.abs(charge) < EPSILON || magneticFieldMagnitude < EPSILON) {
    return null;
  }

  const parallel = project(velocity, magnetic);
  const perpendicular = {
    x: velocity.x - parallel.x,
    y: velocity.y - parallel.y,
    z: velocity.z - parallel.z,
  };

  return (mass * magnitude(perpendicular)) / (Math.abs(charge) * magneticFieldMagnitude);
}

export function kineticEnergy(mass: number, velocity: Vector3): number {
  return 0.5 * mass * dot(velocity, velocity);
}

export function buildParticleState(
  particle: ParticleConfig,
  fields: Fields,
): ParticleState {
  const force = lorentzForce(particle.charge, particle.velocity, fields);
  const acceleration =
    particle.mass > EPSILON ? scale(force, 1 / particle.mass) : { x: 0, y: 0, z: 0 };

  return {
    ...particle,
    force,
    acceleration,
    speed: magnitude(particle.velocity),
    kineticEnergy: kineticEnergy(particle.mass, particle.velocity),
    cyclotronRadius: cyclotronRadius(
      particle.mass,
      particle.charge,
      particle.velocity,
      fields.magnetic,
    ),
    cyclotronPeriod: cyclotronPeriod(
      particle.mass,
      particle.charge,
      magnitude(fields.magnetic),
    ),
    trail: [particle.position],
  };
}

function metricPoint(time: number, particle: ParticleState): MetricPoint {
  return {
    time,
    speed: particle.speed,
    kineticEnergy: particle.kineticEnergy,
    radius: particle.cyclotronRadius,
    period: particle.cyclotronPeriod,
    position: magnitude(particle.position),
    acceleration: magnitude(particle.acceleration),
  };
}

export function initialiseSimulation(
  particles: ParticleConfig[],
  fields: Fields,
): SimulationState {
  const particleStates = particles.map((particle) => buildParticleState(particle, fields));
  const history = Object.fromEntries(
    particleStates.map((particle) => [particle.id, [metricPoint(0, particle)]]),
  );

  return {
    time: 0,
    particles: particleStates,
    history,
  };
}

function borisStep(
  particle: ParticleState,
  fields: Fields,
  dt: number,
): ParticleState {
  const mass = Math.max(particle.mass, EPSILON);
  const qmdt = (particle.charge * dt) / (2 * mass);
  const vMinus = add(particle.velocity, scale(fields.electric, qmdt));
  const t = scale(fields.magnetic, qmdt);
  const tNormSquared = dot(t, t);
  const s = scale(t, 2 / (1 + tNormSquared));
  const vPrime = add(vMinus, cross(vMinus, t));
  const vPlus = add(vMinus, cross(vPrime, s));
  const velocity = add(vPlus, scale(fields.electric, qmdt));
  const position = add(particle.position, scale(velocity, dt));
  const force = lorentzForce(particle.charge, velocity, fields);
  const acceleration = scale(force, 1 / mass);

  return {
    ...particle,
    position,
    velocity,
    force,
    acceleration,
    speed: magnitude(velocity),
    kineticEnergy: kineticEnergy(mass, velocity),
    cyclotronRadius: cyclotronRadius(mass, particle.charge, velocity, fields.magnetic),
    cyclotronPeriod: cyclotronPeriod(mass, particle.charge, magnitude(fields.magnetic)),
  };
}

function appendTrailPoints(
  trail: Vector3[],
  positions: Vector3[],
  trailLimit: number,
): Vector3[] {
  if (trailLimit <= 1) {
    return positions.length > 0 ? [positions[positions.length - 1]] : trail.slice(-1);
  }

  if (positions.length === 0) {
    return trail;
  }

  const nextTrail = [...trail, ...positions];
  return nextTrail.length > trailLimit ? nextTrail.slice(-trailLimit) : nextTrail;
}

export function adaptiveStepDuration(
  requestedSeconds: number,
  particles: ParticleState[],
): number {
  const maxSpeed = Math.max(...particles.map((particle) => particle.speed), 0);
  const preferred = clamp(0.03 / (1 + maxSpeed * 0.35), 0.002, 0.02);
  return Math.min(requestedSeconds, preferred);
}

export function advanceSimulation(
  simulation: SimulationState,
  fields: Fields,
  elapsedSeconds: number,
  trailLimit: number,
): SimulationState {
  if (elapsedSeconds <= 0) {
    return simulation;
  }

  let state = simulation;
  let remaining = elapsedSeconds;
  const trailSegments = Object.fromEntries(
    simulation.particles.map((particle) => [particle.id, [] as Vector3[]]),
  );

  while (remaining > EPSILON) {
    const dt = adaptiveStepDuration(remaining, state.particles);
    const time = state.time + dt;
    const particles = state.particles.map((particle) =>
      borisStep(particle, fields, dt),
    );
    const history = { ...state.history };

    for (const particle of particles) {
      trailSegments[particle.id]?.push(particle.position);
      const nextHistory = [...(history[particle.id] ?? []), metricPoint(time, particle)];
      history[particle.id] = nextHistory.slice(-HISTORY_LIMIT);
    }

    state = {
      time,
      particles,
      history,
    };
    remaining -= dt;
  }

  return {
    ...state,
    particles: state.particles.map((particle) => ({
      ...particle,
      trail: appendTrailPoints(particle.trail, trailSegments[particle.id] ?? [], trailLimit),
    })),
  };
}
