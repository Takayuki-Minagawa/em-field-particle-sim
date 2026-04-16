import { useEffect, useState } from 'react';
import { copy } from '../data/translations';
import { activeParticleLabel, buildExplanation, buildQuiz } from '../lib/learning';
import type { Fields, Language, ParticleState } from '../lib/types';

type LearningPanelProps = {
  language: Language;
  fields: Fields;
  particle: ParticleState | undefined;
};

export function LearningPanel({
  language,
  fields,
  particle,
}: LearningPanelProps) {
  const ui = copy[language];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    setAnswers({});
  }, [language, particle?.id, particle?.speed, fields.electric.x, fields.electric.y, fields.electric.z, fields.magnetic.x, fields.magnetic.y, fields.magnetic.z]);

  if (!particle) {
    return null;
  }

  const explanations = buildExplanation(language, fields, particle);
  const quiz = buildQuiz(language, fields, particle);

  return (
    <section className="panel panel--learning">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">{ui.panels.learning}</p>
          <h2>{activeParticleLabel(language, particle)}</h2>
        </div>
      </div>

      <div className="learning-block">
        <h3>{ui.learning.explanation}</h3>
        {explanations.map((entry) => (
          <p key={entry}>{entry}</p>
        ))}
      </div>

      <div className="learning-block">
        <h3>{ui.learning.quiz}</h3>
        {quiz.map((question) => {
          const answer = answers[question.id];
          const isCorrect = answer === question.correctId;

          return (
            <article className="quiz-card" key={question.id}>
              <p className="quiz-card__prompt">{question.prompt}</p>
              <div className="quiz-card__options">
                {question.options.map((option) => (
                  <button
                    className={`quiz-option ${
                      answer === option.id ? 'quiz-option--active' : ''
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
                    {isCorrect ? ui.learning.correct : ui.learning.wrong}
                  </strong>{' '}
                  {question.explanation}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
