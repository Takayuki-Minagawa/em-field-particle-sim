import { describe, expect, it } from 'vitest';
import { add, cross, magnitude, nearestAxisLabel, vec } from './vector';

describe('vector helpers', () => {
  it('computes cross products with the right-hand rule', () => {
    expect(cross(vec(1, 0, 0), vec(0, 1, 0))).toEqual(vec(0, 0, 1));
  });

  it('adds vectors and measures their magnitude', () => {
    const combined = add(vec(1, 2, 3), vec(-1, 1, 2));
    expect(combined).toEqual(vec(0, 3, 5));
    expect(magnitude(combined)).toBeCloseTo(Math.sqrt(34));
  });

  it('maps a vector to the closest axis label', () => {
    expect(nearestAxisLabel(vec(0.1, 2.5, 0.2), 'en')).toBe('+y direction');
    expect(nearestAxisLabel(vec(0.01, 0.02, 0.03), 'ja')).toBe('ほぼ 0');
  });
});
