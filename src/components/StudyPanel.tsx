import type { ComponentProps } from 'react';
import { copy } from '../data/translations';
import type { Fields, Language, ParticleState, StudyTab } from '../lib/types';
import { LearningPanel } from './LearningPanel';
import { LessonPanel } from './LessonPanel';
import { MissionPanel } from './MissionPanel';

type StudyPanelProps = {
  language: Language;
  tab: StudyTab;
  onTabChange: (tab: StudyTab) => void;
  fields: Fields;
  particle: ParticleState | undefined;
  lessonProps: Omit<ComponentProps<typeof LessonPanel>, 'language'>;
  missionProps: Omit<ComponentProps<typeof MissionPanel>, 'language'>;
};

const TABS: Array<{ id: StudyTab; icon: string }> = [
  { id: 'lessons', icon: '📘' },
  { id: 'missions', icon: '🏆' },
  { id: 'explain', icon: '📖' },
  { id: 'quiz', icon: '❓' },
];

export function StudyPanel({
  language,
  tab,
  onTabChange,
  fields,
  particle,
  lessonProps,
  missionProps,
}: StudyPanelProps) {
  const ui = copy[language];

  return (
    <section className="panel panel--learning" id="study-panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">{ui.panels.learning}</p>
          <h2>{ui.study.tabs[tab]}</h2>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label={ui.panels.learning}>
        {TABS.map((entry) => (
          <button
            aria-controls={`study-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            className={`tab ${tab === entry.id ? 'tab--active' : ''}`}
            id={`study-tab-button-${entry.id}`}
            key={entry.id}
            onClick={() => onTabChange(entry.id)}
            role="tab"
            type="button"
          >
            <span aria-hidden="true">{entry.icon}</span> {ui.study.tabs[entry.id]}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`study-tab-button-${tab}`}
        className="tab-panel"
        id={`study-tab-${tab}`}
        role="tabpanel"
      >
        {tab === 'lessons' && <LessonPanel language={language} {...lessonProps} />}
        {tab === 'missions' && <MissionPanel language={language} {...missionProps} />}
        {tab === 'explain' && (
          <LearningPanel fields={fields} language={language} mode="explain" particle={particle} />
        )}
        {tab === 'quiz' && (
          <LearningPanel fields={fields} language={language} mode="quiz" particle={particle} />
        )}
      </div>
    </section>
  );
}
