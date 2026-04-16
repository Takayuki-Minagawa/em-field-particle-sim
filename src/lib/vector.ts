import type { Language, Vector3 } from './types';

export const EPSILON = 1e-6;

export function vec(x = 0, y = 0, z = 0): Vector3 {
  return { x, y, z };
}

export function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(v: Vector3, factor: number): Vector3 {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function magnitude(v: Vector3): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: Vector3): Vector3 {
  const length = magnitude(v);
  if (length < EPSILON) {
    return vec();
  }

  return scale(v, 1 / length);
}

export function distance(a: Vector3, b: Vector3): number {
  return magnitude(subtract(a, b));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function project(a: Vector3, onto: Vector3): Vector3 {
  const length = magnitude(onto);
  if (length < EPSILON) {
    return vec();
  }

  const unit = scale(onto, 1 / length);
  return scale(unit, dot(a, unit));
}

export function nearestAxisLabel(v: Vector3, language: Language): string {
  const labels =
    language === 'ja'
      ? ['+x 方向', '-x 方向', '+y 方向', '-y 方向', '+z 方向', '-z 方向', 'ほぼ 0']
      : ['+x direction', '-x direction', '+y direction', '-y direction', '+z direction', '-z direction', 'near zero'];

  const candidates = [
    { score: v.x, label: labels[0] },
    { score: -v.x, label: labels[1] },
    { score: v.y, label: labels[2] },
    { score: -v.y, label: labels[3] },
    { score: v.z, label: labels[4] },
    { score: -v.z, label: labels[5] },
  ];

  const length = magnitude(v);
  if (length < 0.1) {
    return labels[6];
  }

  return candidates.sort((a, b) => b.score - a.score)[0]?.label ?? labels[6];
}
