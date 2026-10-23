import { useState } from 'react';
import { copy } from '../data/translations';
import { missions, type MissionStatus } from '../lib/missions';
import type { Language } from '../lib/types';

type MissionPanelProps = {
  language: Language;
  activeMissionId: string | null;
  status: MissionStatus | null;
  completedMissions: string[];
  onStart: (missionId: string) => void;
  onQuit: () => void;
};

export function MissionPanel({
  language,
  activeMissionId,
  status,
  completedMissions,
  onStart,
  onQuit,
}: MissionPanelProps) {
  const ui = copy[language].study;
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});
  const clearedCount = missions.filter((mission) => completedMissions.includes(mission.id)).length;

  return (
    <div className="missions">
      <p className="subtle-note">{ui.missionsIntro}</p>
      <div className="mission-score" aria-live="polite">
        🏆 {clearedCount} / {missions.length}
        <span className="mission-score__bar">
          <span style={{ width: `${(clearedCount / missions.length) * 100}%` }} />
        </span>
      </div>

      {missions.map((mission) => {
        const isActive = mission.id === activeMissionId;
        const isCleared = completedMissions.includes(mission.id);
        const showHint = openHints[mission.id];

        return (
          <section
            aria-label={mission.title[language]}
            className={`mission-card ${isActive ? 'mission-card--active' : ''} ${
              isCleared ? 'mission-card--cleared' : ''
            }`}
            key={mission.id}
          >
            <header className="mission-card__header">
              <span className="mission-card__icon" aria-hidden="true">{mission.icon}</span>
              <div className="mission-card__title">
                <h3>{mission.title[language]}</h3>
                <span
                  aria-label={`${ui.difficulty} ${mission.difficulty} / 3`}
                  className="mission-card__difficulty"
                >
                  {'★'.repeat(mission.difficulty)}
                  <span className="is-dim">{'★'.repeat(3 - mission.difficulty)}</span>
                </span>
              </div>
              {isCleared && <span className="badge badge--success">✓ {ui.cleared}</span>}
              {isActive && !isCleared && <span className="badge">{ui.active}</span>}
            </header>

            <p className="mission-card__story">{mission.story[language]}</p>
            <p className="mission-card__goal">
              <strong>{ui.goal}:</strong> {mission.goal[language]}
            </p>

            {isActive && status && (
              <div className="mission-live">
                <div className="mission-live__row">
                  <span>{ui.progress}</span>
                  <span>{status.complete ? '100%' : `${Math.round(status.progress * 100)}%`}</span>
                </div>
                <div className="meter">
                  <span
                    className={status.complete ? 'is-complete' : ''}
                    style={{ width: `${status.complete ? 100 : status.progress * 100}%` }}
                  />
                </div>
                {/* The readout changes every frame, so keep it out of the live region. */}
                <p className="mission-live__readout" aria-live="off">{status.readout}</p>
                <div role="status">
                  {status.warning && <p className="mission-live__warning">⚠️ {status.warning}</p>}
                  {status.complete && <p className="mission-live__success">🎉 {ui.clearedToast}</p>}
                </div>
              </div>
            )}

            {showHint && (
              <p className="mission-card__hint">💡 {mission.hint[language]}</p>
            )}

            <div className="button-row">
              {isActive ? (
                <>
                  <button className="primary-button" onClick={() => onStart(mission.id)} type="button">
                    ↺ {ui.retry}
                  </button>
                  <button onClick={onQuit} type="button">
                    {ui.quit}
                  </button>
                </>
              ) : (
                <button className="primary-button" onClick={() => onStart(mission.id)} type="button">
                  ▶ {ui.start}
                </button>
              )}
              {!showHint && (
                <button
                  className="ghost-button"
                  onClick={() => setOpenHints((current) => ({ ...current, [mission.id]: true }))}
                  type="button"
                >
                  💡 {ui.showHint}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
