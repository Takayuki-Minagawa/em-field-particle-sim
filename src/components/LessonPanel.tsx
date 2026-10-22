import { lessons } from '../data/lessons';
import { copy } from '../data/translations';
import type { Language } from '../lib/types';

type LessonPanelProps = {
  language: Language;
  lessonIndex: number;
  predictions: Record<string, string>;
  preparedLessonId: string | null;
  completedLessons: string[];
  onLessonChange: (index: number) => void;
  onPrepare: (index: number) => void;
  onPredict: (index: number, optionId: string) => void;
};

export function LessonPanel({
  language,
  lessonIndex,
  predictions,
  preparedLessonId,
  completedLessons,
  onLessonChange,
  onPrepare,
  onPredict,
}: LessonPanelProps) {
  const ui = copy[language].study;
  const lesson = lessons[lessonIndex];
  const answer = predictions[lesson.id];
  const isPrepared = preparedLessonId === lesson.id;
  const isCorrect = answer === lesson.prediction.correctId;

  return (
    <div className="lesson">
      <ol className="lesson-steps" aria-label={copy[language].study.tabs.lessons}>
        {lessons.map((entry, index) => {
          const done = completedLessons.includes(entry.id);
          return (
            <li key={entry.id}>
              <button
                aria-current={index === lessonIndex ? 'step' : undefined}
                aria-label={`${ui.lessonStep} ${index + 1}: ${entry.title[language]}`}
                className={`lesson-step ${index === lessonIndex ? 'lesson-step--active' : ''} ${
                  done ? 'lesson-step--done' : ''
                }`}
                onClick={() => onLessonChange(index)}
                title={entry.title[language]}
                type="button"
              >
                {done ? '✓' : index + 1}
              </button>
            </li>
          );
        })}
      </ol>

      <header className="lesson__header">
        <span className="lesson__icon" aria-hidden="true">{lesson.icon}</span>
        <div>
          <p className="eyebrow">
            {ui.lessonStep} {lessonIndex + 1} / {lessons.length}
          </p>
          <h3>{lesson.title[language]}</h3>
        </div>
      </header>

      <p className="lesson__idea">{lesson.idea[language]}</p>
      <div className="formula" aria-label="formula">{lesson.formula}</div>

      <div className="lesson-block">
        <h4>{ui.points}</h4>
        <ul className="lesson__points">
          {lesson.points[language].map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <button
        className={`primary-button lesson__prepare ${isPrepared ? 'is-ready' : ''}`}
        onClick={() => onPrepare(lessonIndex)}
        type="button"
      >
        {isPrepared && !answer ? `✅ ${ui.prepared}` : `🔬 ${ui.prepare}`}
      </button>

      <div className={`lesson-block lesson-predict ${answer ? 'is-answered' : ''}`}>
        <h4>🤔 {ui.predict}</h4>
        <p className="lesson-predict__prompt">{lesson.prediction.prompt[language]}</p>
        {!answer && <p className="subtle-note">{ui.predictHint}</p>}
        <div className="lesson-predict__options">
          {lesson.prediction.options.map((option) => {
            const chosen = answer === option.id;
            const reveal = Boolean(answer) && option.id === lesson.prediction.correctId;
            return (
              <button
                aria-pressed={chosen}
                className={`quiz-option ${chosen ? 'quiz-option--active' : ''} ${
                  reveal ? 'quiz-option--correct' : ''
                } ${chosen && !reveal ? 'quiz-option--wrong' : ''}`}
                key={option.id}
                onClick={() => onPredict(lessonIndex, option.id)}
                type="button"
              >
                {option.label[language]}
              </button>
            );
          })}
        </div>
        {answer && (
          <p className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
            <strong>{isCorrect ? `🎉 ${copy[language].learning.correct}` : `💡 ${copy[language].learning.wrong}`}</strong>{' '}
            {lesson.prediction.explanation[language]}
          </p>
        )}
      </div>

      {answer && (
        <div className="lesson-block lesson-observe">
          <h4>👀 {ui.observe}</h4>
          <p>{lesson.observe[language]}</p>
          <h4>🧪 {ui.tryNext}</h4>
          <p>{lesson.tryNext[language]}</p>
        </div>
      )}

      <div className="lesson__nav">
        <button
          disabled={lessonIndex === 0}
          onClick={() => onLessonChange(lessonIndex - 1)}
          type="button"
        >
          ← {ui.prev}
        </button>
        <button
          className={answer ? 'primary-button' : ''}
          disabled={lessonIndex === lessons.length - 1}
          onClick={() => onLessonChange(lessonIndex + 1)}
          type="button"
        >
          {ui.next} →
        </button>
      </div>
    </div>
  );
}
