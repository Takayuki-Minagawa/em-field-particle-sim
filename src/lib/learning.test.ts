import { describe, expect, it } from 'vitest';
import { createParticle, defaultFields } from '../data/presets';
import { buildExplanation, buildQuiz } from './learning';
import { buildParticleState } from './physics';

describe('learning content', () => {
  it('creates explanation paragraphs for the current state', () => {
    const particle = buildParticleState(createParticle('electron', 0), defaultFields);
    const explanation = buildExplanation('ja', defaultFields, particle);

    expect(explanation.length).toBeGreaterThanOrEqual(3);
    expect(explanation.join(' ')).toContain('ローレンツ力');
  });

  it('keeps the velocity-selector condition as the correct answer', () => {
    const particle = buildParticleState(createParticle('proton', 1), defaultFields);
    const quiz = buildQuiz('en', defaultFields, particle);
    const selector = quiz.find((entry) => entry.id === 'velocity-selector');

    expect(selector?.correctId).toBe('selector');
    expect(selector?.explanation).toContain('v = E/B');
  });
});
