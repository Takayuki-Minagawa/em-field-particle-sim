import {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';
import { ControlPanel } from './components/ControlPanel';
import { LearningPanel } from './components/LearningPanel';
import { StatsPanel } from './components/StatsPanel';
import {
  createDefaultParticles,
  createParticle,
  defaultFields,
  fieldPresets,
  particleLabel,
} from './data/presets';
import { copy } from './data/translations';
import { activeParticleLabel } from './lib/learning';
import { advanceSimulation, initialiseSimulation } from './lib/physics';
import type {
  FieldPresetId,
  Fields,
  Language,
  ParticleConfig,
  ParticleTemplateId,
  Theme,
  Vector3,
} from './lib/types';
import './styles/global.css';

const SimulationScene = lazy(() =>
  import('./components/SimulationScene').then((module) => ({
    default: module.SimulationScene,
  })),
);

function preferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem('em-field-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialLanguage(): Language {
  if (typeof navigator === 'undefined') {
    return 'ja';
  }

  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function cloneParticle(particle: ParticleConfig): ParticleConfig {
  return {
    ...particle,
    position: { ...particle.position },
    velocity: { ...particle.velocity },
  };
}

export default function App() {
  const initialParticles = createDefaultParticles();
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [theme, setTheme] = useState<Theme>(preferredTheme);
  const [fields, setFields] = useState<Fields>(defaultFields);
  const [particles, setParticles] = useState<ParticleConfig[]>(initialParticles);
  const [presetId, setPresetId] = useState<FieldPresetId>('orthogonal');
  const [activeParticleId, setActiveParticleId] = useState(initialParticles[0].id);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(true);
  const [trailLimit, setTrailLimit] = useState(150);
  const [cameraFollow, setCameraFollow] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [nextParticleSerial, setNextParticleSerial] = useState(initialParticles.length);
  const [simulation, setSimulation] = useState(() =>
    initialiseSimulation(initialParticles, defaultFields),
  );

  const ui = copy[language];
  const deferredSimulation = useDeferredValue(simulation);
  const activeParticle = deferredSimulation.particles.find(
    (particle) => particle.id === activeParticleId,
  );
  const activeHistory = deferredSimulation.history[activeParticleId] ?? [];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('em-field-theme', theme);
  }, [theme]);

  const resetSimulation = useEffectEvent(
    (nextFields: Fields = fields, nextParticles: ParticleConfig[] = particles) => {
      startTransition(() => {
        setSimulation(initialiseSimulation(nextParticles, nextFields));
      });
    },
  );

  const animate = useEffectEvent((deltaMs: number) => {
    if (!isRunning) {
      return;
    }

    const elapsedSeconds = Math.min(deltaMs, 48) / 1000 * playbackSpeed * 1.6;
    startTransition(() => {
      setSimulation((current) =>
        advanceSimulation(current, fields, elapsedSeconds, trailLimit),
      );
    });
  });

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      animate(now - last);
      last = now;
      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  function applyParticleChange(nextParticles: ParticleConfig[]) {
    setParticles(nextParticles);
    resetSimulation(fields, nextParticles);
  }

  function applyFieldChange(nextFields: Fields, nextParticles: ParticleConfig[] = particles) {
    setFields(nextFields);
    resetSimulation(nextFields, nextParticles);
  }

  function handleFieldPresetChange(nextPresetId: FieldPresetId) {
    if (nextPresetId === 'custom') {
      setPresetId('custom');
      return;
    }

    const preset = fieldPresets.find((entry) => entry.id === nextPresetId);
    if (!preset) {
      return;
    }

    const nextFields = {
      ...fields,
      electric: { ...preset.electric },
      magnetic: { ...preset.magnetic },
    };
    let nextParticles = particles.map((particle) => cloneParticle(particle));

    if (preset.recommendedVelocity) {
      const recommendedVelocity = preset.recommendedVelocity;
      nextParticles = nextParticles.map((particle) =>
        particle.id === activeParticleId
          ? {
              ...particle,
              velocity: {
                x: recommendedVelocity.x,
                y: recommendedVelocity.y,
                z: recommendedVelocity.z,
              },
            }
          : particle,
      );
      setParticles(nextParticles);
    }

    setPresetId(nextPresetId);
    applyFieldChange(nextFields, nextParticles);
  }

  function handleFieldVectorChange(
    field: 'electric' | 'magnetic',
    axis: keyof Vector3,
    value: number,
  ) {
    const nextFields = {
      ...fields,
      [field]: {
        ...fields[field],
        [axis]: value,
      },
    };
    setPresetId('custom');
    applyFieldChange(nextFields);
  }

  function handleParticleScalarChange(
    particleId: string,
    key: 'mass' | 'charge',
    value: number,
  ) {
    const nextParticles = particles.map((particle) =>
      particle.id === particleId ? { ...particle, [key]: value } : particle,
    );
    applyParticleChange(nextParticles);
  }

  function handleParticleVectorChange(
    particleId: string,
    key: 'position' | 'velocity',
    axis: keyof Vector3,
    value: number,
  ) {
    const nextParticles = particles.map((particle) =>
      particle.id === particleId
        ? {
            ...particle,
            [key]: {
              ...particle[key],
              [axis]: value,
            },
          }
        : particle,
    );
    applyParticleChange(nextParticles);
  }

  function handleAddParticle(templateId: ParticleTemplateId) {
    const particle = createParticle(templateId, nextParticleSerial);
    const nextParticles = [
      ...particles,
      {
        ...particle,
        position: {
          ...particle.position,
          y: particle.position.y + (nextParticleSerial % 4) * 0.55,
        },
      },
    ];
    setNextParticleSerial((current) => current + 1);
    setActiveParticleId(particle.id);
    applyParticleChange(nextParticles);
  }

  function handleRemoveParticle(particleId: string) {
    if (particles.length === 1) {
      return;
    }

    const nextParticles = particles.filter((particle) => particle.id !== particleId);
    setActiveParticleId(nextParticles[0].id);
    applyParticleChange(nextParticles);
  }

  function handleReset() {
    resetSimulation();
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">EM FIELD LAB</p>
          <h1>{ui.title}</h1>
          <p>{ui.subtitle}</p>
          <p className="subtle-note">{ui.normalizedNote}</p>
        </div>
        <div className="hero__controls">
          <label className="control hero-control">
            <span>{ui.toggles.language}</span>
            <select
              onChange={(event) => setLanguage(event.target.value as Language)}
              value={language}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="control hero-control">
            <span>{ui.toggles.theme}</span>
            <select
              onChange={(event) => setTheme(event.target.value as Theme)}
              value={theme}
            >
              <option value="light">{ui.toggles.themeValue.light}</option>
              <option value="dark">{ui.toggles.themeValue.dark}</option>
            </select>
          </label>
          <div className="status-card">
            <strong>{activeParticle ? activeParticleLabel(language, activeParticle) : ''}</strong>
            <span>{ui.metrics.time}: {deferredSimulation.time.toFixed(2)}</span>
            <span>{ui.controls.speed}: {playbackSpeed.toFixed(2)}x</span>
            <span>{isRunning ? ui.controls.play : ui.controls.pause}</span>
          </div>
        </div>
      </header>

      <main className="layout">
        <ControlPanel
          activeParticleId={activeParticleId}
          cameraFollow={cameraFollow}
          fields={fields}
          isRunning={isRunning}
          language={language}
          onAddParticle={handleAddParticle}
          onCameraFollowChange={setCameraFollow}
          onDensityChange={(value) =>
            applyFieldChange({ ...fields, density: Math.max(1, Math.min(value, 5)) })
          }
          onFieldPresetChange={handleFieldPresetChange}
          onFieldVectorChange={handleFieldVectorChange}
          onParticleScalarChange={handleParticleScalarChange}
          onParticleSelect={setActiveParticleId}
          onParticleVectorChange={handleParticleVectorChange}
          onPlaybackSpeedChange={setPlaybackSpeed}
          onRemoveParticle={handleRemoveParticle}
          onReset={handleReset}
          onResetView={() => setCameraResetToken((current) => current + 1)}
          onScaleModeChange={(value) => applyFieldChange({ ...fields, scaleMode: value })}
          onToggleRunning={() => setIsRunning((current) => !current)}
          onTrailLimitChange={setTrailLimit}
          particles={particles}
          playbackSpeed={playbackSpeed}
          presetId={presetId}
          trailLimit={trailLimit}
        />

        <section className="center-column">
          <section className="panel panel--scene">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">{ui.panels.simulation}</p>
                <h2>{activeParticle ? particleLabel(activeParticle, language) : ui.panels.simulation}</h2>
              </div>
            </div>
            <Suspense
              fallback={
                <div className="scene-shell scene-shell--loading">
                  {language === 'ja' ? '3D シーンを読み込み中...' : 'Loading 3D scene...'}
                </div>
              }
            >
              <SimulationScene
                activeParticleId={activeParticleId}
                cameraFollow={cameraFollow}
                cameraResetToken={cameraResetToken}
                fields={fields}
                language={language}
                particles={deferredSimulation.particles}
              />
            </Suspense>
          </section>
          <StatsPanel
            history={activeHistory}
            language={language}
            particle={activeParticle}
          />
        </section>

        <LearningPanel
          fields={fields}
          language={language}
          particle={activeParticle}
        />
      </main>
    </div>
  );
}
