import { copy } from '../data/translations';
import type { Language, MetricPoint, ParticleState } from '../lib/types';
import { magnitude } from '../lib/vector';
import { LineChart } from './LineChart';

type StatsPanelProps = {
  language: Language;
  particle: ParticleState | undefined;
  history: MetricPoint[];
};

function formatValue(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }

  return value.toFixed(digits);
}

export function StatsPanel({ language, particle, history }: StatsPanelProps) {
  const ui = copy[language];

  if (!particle) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">{ui.panels.stats}</p>
          <h2>{ui.metrics.history}</h2>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card">
          <span>{ui.metrics.speed}</span>
          <strong>{formatValue(particle.speed)}</strong>
        </article>
        <article className="metric-card">
          <span>{ui.metrics.kineticEnergy}</span>
          <strong>{formatValue(particle.kineticEnergy)}</strong>
        </article>
        <article className="metric-card">
          <span>{ui.metrics.force}</span>
          <strong>{formatValue(magnitude(particle.force))}</strong>
        </article>
        <article className="metric-card">
          <span>{ui.metrics.acceleration}</span>
          <strong>{formatValue(magnitude(particle.acceleration))}</strong>
        </article>
        <article className="metric-card">
          <span>{ui.metrics.radius}</span>
          <strong>{formatValue(particle.cyclotronRadius)}</strong>
        </article>
        <article className="metric-card">
          <span>{ui.metrics.period}</span>
          <strong>{formatValue(particle.cyclotronPeriod)}</strong>
        </article>
      </div>

      <div className="chart-grid">
        <LineChart
          title={ui.metrics.speed}
          values={history.map((point) => point.speed)}
          color="#23b5d3"
          currentValueLabel={formatValue(history.at(-1)?.speed)}
        />
        <LineChart
          title={ui.metrics.kineticEnergy}
          values={history.map((point) => point.kineticEnergy)}
          color="#ff6b57"
          currentValueLabel={formatValue(history.at(-1)?.kineticEnergy)}
        />
        <LineChart
          title={ui.metrics.radius}
          values={history.map((point) => point.radius)}
          color="#ffb84d"
          currentValueLabel={formatValue(history.at(-1)?.radius)}
        />
        <LineChart
          title={ui.metrics.position}
          values={history.map((point) => point.position)}
          color="#63c132"
          currentValueLabel={formatValue(history.at(-1)?.position)}
        />
      </div>
      {!particle.cyclotronRadius && (
        <p className="subtle-note">{ui.metrics.noRadius}</p>
      )}
    </section>
  );
}
