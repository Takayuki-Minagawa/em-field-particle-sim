import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/SimulationScene', () => ({
  SimulationScene: () => null,
}));

let callbacks: FrameRequestCallback[] = [];
let now = 0;

beforeEach(() => {
  callbacks = [];
  now = 0;
  window.localStorage.clear();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    callbacks.push(callback);
    return callbacks.length;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = () => {};
  window.matchMedia = (() => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function frames(count: number) {
  for (let index = 0; index < count; index += 1) {
    now += 48;
    const pending = callbacks;
    callbacks = [];
    await act(async () => {
      pending.forEach((callback) => callback(now));
    });
  }
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

async function startMission(name: string) {
  await click(screen.getByRole('tab', { name: /Missions/ }));
  const card = screen.getByRole('region', { name });
  await click(within(card).getByRole('button', { name: /Start/ }));
}

function storedMissions() {
  return JSON.parse(window.localStorage.getItem('em-field-missions') ?? '[]') as string[];
}

describe('App mission flow', () => {
  it('does not clear a mission from the previous lesson run', async () => {
    render(<App />);
    await click(screen.getByRole('button', { name: /-x \(against the field\)/ }));
    await frames(50);

    await startMission('Electric rocket');
    await frames(3);

    expect(storedMissions()).not.toContain('accelerate');
  });

  it('does not clear the radius mission right after the magnetic-force lesson', async () => {
    render(<App />);
    await click(screen.getByRole('button', { name: /Next/ }));
    await click(screen.getByRole('button', { name: /^-y$/ }));
    await frames(40);

    await startMission('Radius exactly 2');
    await frames(3);

    expect(storedMissions()).not.toContain('circle');
  });

  it('clears a mission once its own run meets the goal and keeps it cleared', async () => {
    render(<App />);
    await startMission('Electric rocket');

    const electric = screen.getByRole('group', { name: /Electric field E/ });
    await act(async () => {
      fireEvent.change(within(electric).getAllByRole('spinbutton')[0], { target: { value: '1.5' } });
    });
    await frames(120);

    expect(storedMissions()).toContain('accelerate');
    expect(screen.getByRole('region', { name: 'Electric rocket' })).toHaveTextContent(/Mission cleared!/);
  });

  it('does not judge a restarted mission on the free-play run after Quit', async () => {
    render(<App />);
    await startMission('Draw a helix');
    await click(within(screen.getByRole('region', { name: 'Draw a helix' })).getByRole('button', { name: /Quit/ }));

    const velocity = screen.getByRole('group', { name: /Initial velocity/ });
    await act(async () => {
      fireEvent.change(within(velocity).getAllByRole('spinbutton')[2], { target: { value: '0.8' } });
    });
    await frames(80);

    await click(within(screen.getByRole('region', { name: 'Draw a helix' })).getByRole('button', { name: /Start/ }));
    await frames(3);

    expect(storedMissions()).not.toContain('helix');
  });

  it('keeps presets from handing over the launch velocity during a mission', async () => {
    render(<App />);
    await startMission('Draw a helix');
    await click(screen.getByRole('button', { name: /Magnetic only/ }));
    await frames(120);

    expect(storedMissions()).not.toContain('helix');
  });
});
