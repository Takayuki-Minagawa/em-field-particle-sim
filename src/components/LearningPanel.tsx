import { useEffect, useState } from 'react';
import { copy } from '../data/translations';
import { buildExplanation, buildQuiz } from '../lib/learning';
import type { Fields, Language, ParticleState } from '../lib/types';

type LearningPanelProps = {
  language: Language;
  fields: Fields;
  particle: ParticleState | undefined;
  mode?: 'all' | 'explain' | 'quiz';
};

export function LearningPanel({
  language,
  fields,
  particle,
  mode = 'all',
}: LearningPanelProps) {
  const ui = copy[language];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setAnswers({});
  }, [
    language,
    particle?.id,
    fields.electric.x,
    fields.electric.y,
    fields.electric.z,
    fields.magnetic.x,
    fields.magnetic.y,
    fields.magnetic.z,
  ]);

  if (!particle) {
    return null;
  }

  const explanations = buildExplanation(language, fields, particle);
  const quiz = buildQuiz(language, fields, particle);

  const score = quiz.filter((question) => answers[question.id] === question.correctId).length;
  const answered = quiz.filter((question) => answers[question.id]).length;

  return (
    <div className="learning-panel">
      {mode !== 'quiz' && (
        <div className="learning-block">
          <h3>📖 {ui.learning.explanation}</h3>
          {explanations.map((entry) => (
            <p key={entry}>{entry}</p>
          ))}
        </div>
      )}

      {mode !== 'explain' && (
        <div className="learning-block">
          <div className="learning-block__heading">
            <h3>❓ {ui.learning.quiz}</h3>
            <span className="badge" aria-live="polite">
              {ui.study.quizScore} {score} / {quiz.length}
              {answered === quiz.length && score === quiz.length ? ' 🌟' : ''}
            </span>
          </div>
          {quiz.map((question, index) => {
            const answer = answers[question.id];
            const isCorrect = answer === question.correctId;

            return (
              <article className="quiz-card" key={question.id}>
                <p className="quiz-card__prompt">
                  <span className="quiz-card__number">Q{index + 1}</span> {question.prompt}
                </p>
                <div className="quiz-card__options">
                  {question.options.map((option) => (
                    <button
                      className={`quiz-option ${
                        answer === option.id ? 'quiz-option--active' : ''
                      } ${answer === option.id && isCorrect ? 'quiz-option--correct' : ''} ${
                        answer === option.id && !isCorrect ? 'quiz-option--wrong' : ''
                      }`}
                      key={option.id}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {answer && (
                  <p className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    <strong>
                      {isCorrect ? `🎉 ${ui.learning.correct}` : `💡 ${ui.learning.wrong}`}
                    </strong>{' '}
                    {question.explanation}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
