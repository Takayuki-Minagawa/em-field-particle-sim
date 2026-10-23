import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Celebration } from './components/Celebration';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { StudyPanel } from './components/StudyPanel';
import { SCENE_COLORS } from './data/colors';
import { lessons } from './data/lessons';
import {
  createDefaultParticles,
  createParticle,
  createScenarioParticles,
  defaultFields,
  fieldPresets,
  particleLabel,
} from './data/presets';
import { copy } from './data/translations';
import { missions } from './lib/missions';
import { advanceSimulation, initialiseSimulation } from './lib/physics';
import type {
  FieldPresetId,
  Fields,
  Language,
  ParticleConfig,
  ParticleTemplateId,
  ScenarioSetup,
  StudyTab,
  Theme,
  Vector3,
} from './lib/types';
import './styles/global.css';

const MAX_PARTICLES = 8;

const SimulationScene = lazy(() =>
  import('./components/SimulationScene').then((module) => ({
    default: module.SimulationScene,
  })),
);

const THEME_KEY = 'em-field-theme';
const LESSONS_KEY = 'em-field-lessons';
const MISSIONS_KEY = 'em-field-missions';
const PLAYBACK_SPEEDS = [0.5, 1, 2, 4];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); progress is then per-session.
  }
}

function readIdList(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function preferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = readStorage(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function isTextEntryTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  );
}

function isKeyboardFocusedControl(target: EventTarget | null) {
  if (!(target instanceof HTMLElement) || !target.matches('button, summary, a[href]')) {
    return false;
  }

  // Space should still activate a control the user reached with the keyboard, but not one that
  // merely kept focus after a mouse click.
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}

function missionScenario(missionId: string) {
  return `mission:${missionId}`;
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

const INITIAL_PARTICLES = createDefaultParticles();

export default function App() {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [theme, setTheme] = useState<Theme>(preferredTheme);
  const [fields, setFields] = useState<Fields>(defaultFields);
  const [particles, setParticles] = useState<ParticleConfig[]>(INITIAL_PARTICLES);
  const [presetId, setPresetId] = useState<FieldPresetId>('orthogonal');
  const [activeParticleId, setActiveParticleId] = useState(INITIAL_PARTICLES[0].id);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(true);
  const [trailLimit, setTrailLimit] = useState(150);
  const [cameraFollow, setCameraFollow] = useState(false);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [nextParticleSerial, setNextParticleSerial] = useState(INITIAL_PARTICLES.length);
  const [simulation, setSimulation] = useState(() =>
    initialiseSimulation(INITIAL_PARTICLES, defaultFields),
  );
  const [studyTab, setStudyTab] = useState<StudyTab>('lessons');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonPredictions, setLessonPredictions] = useState<Record<string, string>>({});
  const [preparedLessonId, setPreparedLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => readIdList(LESSONS_KEY));
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>(() => readIdList(MISSIONS_KEY));
  const [celebration, setCelebration] = useState({ message: '', token: 0 });
  const [clearedRun, setClearedRun] = useState<object | null>(null);

  const ui = copy[language];
  const deferredSimulation = useDeferredValue(simulation);
  const activeParticle = deferredSimulation.particles.find(
    (particle) => particle.id === activeParticleId,
  );
  const activeHistory = deferredSimulation.history[activeParticleId] ?? [];
  const canAddParticle = particles.length < MAX_PARTICLES;
  const activeMission = missions.find((mission) => mission.id === activeMissionId) ?? null;
  // Each run of the simulation gets its own `fields` copy, so the object identifies one attempt.
  const currentRun = deferredSimulation.fields;
  const rawMissionStatus = useMemo(() => {
    // Only judge runs that this mission set up; the deferred state can still hold the previous run.
    if (!activeMission || deferredSimulation.scenario !== missionScenario(activeMission.id)) {
      return null;
    }

    // Judge the mission's own particle (the first scenario particle), not whichever is selected.
    const particleId = `${activeMission.setup.particles[0].templateId}-0`;
    const particle = deferredSimulation.particles.find((entry) => entry.id === particleId);
    if (!particle) {
      return null;
    }

    return activeMission.evaluate({
      particle,
      fields: deferredSimulation.fields,
      time: deferredSimulation.time,
      language,
    });
  }, [activeMission, deferredSimulation, language]);
  const missionStatus =
    rawMissionStatus && clearedRun === currentRun
      ? { ...rawMissionStatus, complete: true, progress: 1, warning: undefined }
      : rawMissionStatus;

  const fieldsRef = useRef(fields);
  const particlesRef = useRef(particles);
  const isRunningRef = useRef(isRunning);
  const playbackSpeedRef = useRef(playbackSpeed);
  const trailLimitRef = useRef(trailLimit);
  fieldsRef.current = fields;
  particlesRef.current = particles;
  isRunningRef.current = isRunning;
  playbackSpeedRef.current = playbackSpeed;
  trailLimitRef.current = trailLimit;

  const scenarioRef = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStorage(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    writeStorage(LESSONS_KEY, JSON.stringify(completedLessons));
  }, [completedLessons]);

  useEffect(() => {
    writeStorage(MISSIONS_KEY, JSON.stringify(completedMissions));
  }, [completedMissions]);

  useEffect(() => {
    if (!activeMission || !rawMissionStatus?.complete || clearedRun === currentRun) {
      return;
    }

    // Latch the clear for this run so the badge stays on after the particle moves past the goal.
    setClearedRun(currentRun);
    setCompletedMissions((current) =>
      current.includes(activeMission.id) ? current : [...current, activeMission.id],
    );
    setCelebration((current) => ({
      message: `${activeMission.icon} ${copy[language].study.clearedToast}`,
      token: current.token + 1,
    }));
  }, [activeMission, clearedRun, currentRun, language, rawMissionStatus?.complete]);

  const resetSimulation = useCallback(
    (nextFields?: Fields, nextParticles?: ParticleConfig[]) => {
      startTransition(() => {
        setSimulation(
          initialiseSimulation(
            nextParticles ?? particlesRef.current,
            nextFields ?? fieldsRef.current,
            scenarioRef.current,
          ),
        );
      });
    },
    [],
  );

  const animate = useCallback((deltaMs: number) => {
    if (!isRunningRef.current) {
      return;
    }

    const elapsedSeconds = Math.min(deltaMs, 48) / 1000 * playbackSpeedRef.current * 1.6;
    startTransition(() => {
      setSimulation((current) =>
        advanceSimulation(current, fieldsRef.current, elapsedSeconds, trailLimitRef.current),
      );
    });
  }, []);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTextEntryTarget(event.target)
      ) {
        return;
      }

      if (event.code === 'Space') {
        if (isKeyboardFocusedControl(event.target)) {
          return;
        }
        event.preventDefault();
        setIsRunning((current) => !current);
      } else if (event.key === 'r' || event.key === 'R') {
        resetSimulation();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetSimulation]);

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
    if (!canAddParticle) {
      return;
    }

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

  function applyScenario(setup: ScenarioSetup, scenario: string) {
    scenarioRef.current = scenario;
    const nextParticles = createScenarioParticles(setup, 0);
    const nextFields = {
      ...fields,
      electric: { ...setup.electric },
      magnetic: { ...setup.magnetic },
    };

    setPresetId('custom');
    setParticles(nextParticles);
    setActiveParticleId(nextParticles[0].id);
    setNextParticleSerial(nextParticles.length);
    setCameraFollow(false);
    setCameraResetToken((current) => current + 1);
    applyFieldChange(nextFields, nextParticles);
  }

  function handleLessonChange(index: number) {
    setLessonIndex(Math.max(0, Math.min(index, lessons.length - 1)));
  }

  function handleLessonPrepare(index: number) {
    const lesson = lessons[index];
    setActiveMissionId(null);
    setLessonPredictions((current) => {
      const next = { ...current };
      delete next[lesson.id];
      return next;
    });
    setPreparedLessonId(lesson.id);
    setIsRunning(false);
    applyScenario(lesson.setup, `lesson:${lesson.id}`);
  }

  function handleLessonPredict(index: number, optionId: string) {
    const lesson = lessons[index];
    // The first answer counts; "Set up this experiment" clears it for another try.
    if (lessonPredictions[lesson.id]) {
      return;
    }

    if (preparedLessonId !== lesson.id) {
      setActiveMissionId(null);
      setPreparedLessonId(lesson.id);
      applyScenario(lesson.setup, `lesson:${lesson.id}`);
    }

    setLessonPredictions((current) => ({ ...current, [lesson.id]: optionId }));
    setCompletedLessons((current) => (current.includes(lesson.id) ? current : [...current, lesson.id]));
    setIsRunning(true);

    if (optionId === lesson.prediction.correctId) {
      setCelebration((current) => ({
        message: `${lesson.icon} ${copy[language].study.lessonToast}`,
        token: current.token + 1,
      }));
    }
  }

  function handleMissionStart(missionId: string) {
    const mission = missions.find((entry) => entry.id === missionId);
    if (!mission) {
      return;
    }

    setActiveMissionId(mission.id);
    setPreparedLessonId(null);
    setIsRunning(true);
    applyScenario(mission.setup, missionScenario(mission.id));
  }

  function cyclePlaybackSpeed() {
    setPlaybackSpeed(PLAYBACK_SPEEDS.find((speed) => speed > playbackSpeed) ?? PLAYBACK_SPEEDS[0]);
  }

  const lessonsDone = completedLessons.filter((id) => lessons.some((lesson) => lesson.id === id)).length;
  const missionsDone = completedMissions.filter((id) => missions.some((mission) => mission.id === id)).length;
  const legend = [
    { color: SCENE_COLORS.electric, label: ui.legend.electric },
    { color: SCENE_COLORS.magnetic, label: ui.legend.magnetic },
    { color: SCENE_COLORS.velocity, label: ui.legend.velocity },
    { color: SCENE_COLORS.force, label: ui.legend.force },
    ...(activeMission?.target ? [{ color: SCENE_COLORS.target, label: ui.legend.target }] : []),
  ];

  function openStudyTab(tab: StudyTab) {
    setStudyTab(tab);
    document.getElementById('study-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__orbit" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <defs>
              <radialGradient id="hero-glow">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="45%" stopColor="#ff8a70" />
                <stop offset="100%" stopColor="#ff6b57" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle className="hero__orbit-path" cx="60" cy="60" r="40" />
            <circle className="hero__orbit-path hero__orbit-path--inner" cx="60" cy="60" r="22" />
            <g className="hero__orbit-spin">
              <circle cx="100" cy="60" r="9" fill="url(#hero-glow)" />
              <circle cx="100" cy="60" r="4" fill="#fff" />
            </g>
            <g className="hero__orbit-spin hero__orbit-spin--reverse">
              <circle cx="82" cy="60" r="6" fill="#28b9ff" opacity="0.9" />
            </g>
          </svg>
        </div>
        <div className="hero__copy">
          <p className="eyebrow">EM FIELD LAB</p>
          <h1>{ui.title}</h1>
          <p>{ui.subtitle}</p>
          <ol className="journey">
            {ui.hero.steps.map((step, index) => (
              <li key={step}>
                <button
                  className="journey__step"
                  onClick={() =>
                    index === 0
                      ? openStudyTab('lessons')
                      : index === 2
                        ? openStudyTab('missions')
                        : document.querySelector('.panel--scene')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  type="button"
                >
                  <span className="journey__number">{index + 1}</span>
                  {step}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="hero__controls">
          <div className="hero__toggles">
            <div className="segmented" role="group" aria-label={ui.toggles.language}>
              {(['ja', 'en'] as const).map((value) => (
                <button
                  aria-pressed={language === value}
                  className={language === value ? 'is-active' : ''}
                  key={value}
                  onClick={() => setLanguage(value)}
                  type="button"
                >
                  {value === 'ja' ? '日本語' : 'English'}
                </button>
              ))}
            </div>
            <button
              aria-label={`${ui.toggles.theme}: ${ui.toggles.themeValue[theme]}`}
              className="icon-button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              title={ui.toggles.theme}
              type="button"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="progress-card">
            <button className="progress-card__item" onClick={() => openStudyTab('lessons')} type="button">
              <span className="progress-card__icon" aria-hidden="true">📘</span>
              <span>
                <small>{ui.hero.lessons}</small>
                <strong>{lessonsDone} / {lessons.length}</strong>
              </span>
              <span className="progress-ring" style={{ '--progress': lessonsDone / lessons.length } as CSSProperties} />
            </button>
            <button className="progress-card__item" onClick={() => openStudyTab('missions')} type="button">
              <span className="progress-card__icon" aria-hidden="true">🏆</span>
              <span>
                <small>{ui.hero.missions}</small>
                <strong>{missionsDone} / {missions.length}</strong>
              </span>
              <span className="progress-ring" style={{ '--progress': missionsDone / missions.length } as CSSProperties} />
            </button>
          </div>
          <p className="subtle-note hero__note">{ui.normalizedNote}</p>
        </div>
      </header>

      <main className="layout">
        <ControlPanel
          activeParticleId={activeParticleId}
          cameraFollow={cameraFollow}
          canAddParticle={canAddParticle}
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
              <span className="subtle-note scene-shortcuts">⌨️ {ui.hero.shortcuts}</span>
            </div>
            <div className="scene-stage">
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
                  target={activeMission?.target}
                  theme={theme}
                />
              </Suspense>

              <ul className="scene-legend" aria-label="legend">
                {legend.map((entry) => (
                  <li key={entry.label}>
                    <span className="scene-legend__swatch" style={{ background: entry.color }} />
                    {entry.label}
                  </li>
                ))}
              </ul>

              <div className="scene-hud" aria-live="off">
                <span>t = {deferredSimulation.time.toFixed(1)}</span>
                <span>|v| = {activeParticle ? activeParticle.speed.toFixed(2) : '--'}</span>
              </div>

              {activeMission && missionStatus && (
                <button
                  className={`scene-mission ${missionStatus.complete ? 'is-complete' : ''}`}
                  onClick={() => openStudyTab('missions')}
                  type="button"
                >
                  <span className="scene-mission__title">
                    {activeMission.icon} {activeMission.title[language]}
                    {missionStatus.complete ? ` — ✓ ${ui.study.cleared}` : ''}
                  </span>
                  <span className="meter meter--compact">
                    <span
                      className={missionStatus.complete ? 'is-complete' : ''}
                      style={{ width: `${missionStatus.complete ? 100 : missionStatus.progress * 100}%` }}
                    />
                  </span>
                  <span className="scene-mission__readout">{missionStatus.warning ?? missionStatus.readout}</span>
                </button>
              )}

              <div className="scene-toolbar">
                <button
                  aria-label={isRunning ? ui.controls.pause : ui.controls.play}
                  className="scene-toolbar__play"
                  onClick={() => setIsRunning((current) => !current)}
                  title={isRunning ? ui.controls.pause : ui.controls.play}
                  type="button"
                >
                  {isRunning ? '❚❚' : '▶'}
                </button>
                <button
                  aria-label={ui.controls.reset}
                  onClick={handleReset}
                  title={ui.controls.reset}
                  type="button"
                >
                  ↺
                </button>
                <button
                  aria-label={`${ui.controls.speed} ${playbackSpeed}x`}
                  onClick={cyclePlaybackSpeed}
                  title={ui.controls.speed}
                  type="button"
                >
                  {playbackSpeed}x
                </button>
                <button
                  aria-label={ui.controls.resetView}
                  onClick={() => setCameraResetToken((current) => current + 1)}
                  title={ui.controls.resetView}
                  type="button"
                >
                  🎥
                </button>
              </div>
            </div>
          </section>
          <StatsPanel
            history={activeHistory}
            language={language}
            particle={activeParticle}
          />
        </section>

        <StudyPanel
          fields={fields}
          language={language}
          lessonProps={{
            completedLessons,
            lessonIndex,
            onLessonChange: handleLessonChange,
            onPredict: handleLessonPredict,
            onPrepare: handleLessonPrepare,
            predictions: lessonPredictions,
            preparedLessonId,
          }}
          missionProps={{
            activeMissionId,
            completedMissions,
            onQuit: () => setActiveMissionId(null),
            onStart: handleMissionStart,
            status: missionStatus,
          }}
          onTabChange={setStudyTab}
          particle={activeParticle}
          tab={studyTab}
        />
      </main>

      <Celebration message={celebration.message} token={celebration.token} />
    </div>
  );
}
