import type { ComponentProps, KeyboardEvent } from 'react';
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

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((entry) => entry.id === tab);
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let nextIndex: number | null = null;
    if (event.key in offsets) {
      nextIndex = (index + offsets[event.key] + TABS.length) % TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = TABS.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const nextTab = TABS[nextIndex].id;
    onTabChange(nextTab);
    document.getElementById(`study-tab-button-${nextTab}`)?.focus();
  }

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
            aria-controls={tab === entry.id ? `study-tab-${entry.id}` : undefined}
            aria-selected={tab === entry.id}
            className={`tab ${tab === entry.id ? 'tab--active' : ''}`}
            id={`study-tab-button-${entry.id}`}
            key={entry.id}
            onClick={() => onTabChange(entry.id)}
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={tab === entry.id ? 0 : -1}
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
        tabIndex={0}
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
