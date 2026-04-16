import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { defaultFields, createParticle } from '../data/presets';
import { buildParticleState } from '../lib/physics';
import { LearningPanel } from './LearningPanel';

describe('LearningPanel', () => {
  it('keeps quiz answers when only the particle speed changes', () => {
    const particle = buildParticleState(createParticle('electron', 0), defaultFields);
    const { rerender } = render(
      <LearningPanel fields={defaultFields} language="en" particle={particle} />,
    );

    const firstQuestion = screen.getAllByRole('article')[0];
    const selectedOption = within(firstQuestion).getAllByRole('button')[0];

    fireEvent.click(selectedOption);
    expect(selectedOption).toHaveClass('quiz-option--active');

    rerender(
      <LearningPanel
        fields={defaultFields}
        language="en"
        particle={{ ...particle, speed: particle.speed + 1 }}
      />,
    );

    const updatedQuestion = screen.getAllByRole('article')[0];
    expect(within(updatedQuestion).getAllByRole('button')[0]).toHaveClass(
      'quiz-option--active',
    );
  });
});
