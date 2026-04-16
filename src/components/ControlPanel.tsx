import type { CSSProperties } from 'react';
import { particleLabel } from '../data/presets';
import { copy } from '../data/translations';
import type {
  FieldPresetId,
  Fields,
  Language,
  ParticleConfig,
  ParticleTemplateId,
  ScaleMode,
  Vector3,
} from '../lib/types';

type ControlPanelProps = {
  language: Language;
  fields: Fields;
  particles: ParticleConfig[];
  activeParticleId: string;
  presetId: FieldPresetId;
  isRunning: boolean;
  playbackSpeed: number;
  trailLimit: number;
  cameraFollow: boolean;
  onFieldPresetChange: (presetId: FieldPresetId) => void;
  onFieldVectorChange: (field: 'electric' | 'magnetic', axis: keyof Vector3, value: number) => void;
  onDensityChange: (value: number) => void;
  onScaleModeChange: (value: ScaleMode) => void;
  onParticleSelect: (particleId: string) => void;
  onParticleScalarChange: (
    particleId: string,
    key: 'mass' | 'charge',
    value: number,
  ) => void;
  onParticleVectorChange: (
    particleId: string,
    key: 'position' | 'velocity',
    axis: keyof Vector3,
    value: number,
  ) => void;
  onAddParticle: (templateId: ParticleTemplateId) => void;
  onRemoveParticle: (particleId: string) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onPlaybackSpeedChange: (value: number) => void;
  onTrailLimitChange: (value: number) => void;
  onCameraFollowChange: (value: boolean) => void;
  onResetView: () => void;
};

type NumberControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
};

type VectorControlProps = {
  label: string;
  vector: Vector3;
  range: [number, number];
  step?: number;
  onChange: (axis: keyof Vector3, value: number) => void;
};

function NumberControl({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: NumberControlProps) {
  return (
    <label className="control">
      <span>{label}</span>
      <div className="control__row">
        <input
          max={max}
          min={min}
          onChange={(event) => onChange(Number.parseFloat(event.target.value))}
          step={step}
          type="range"
          value={value}
        />
        <input
          className="control__number"
          max={max}
          min={min}
          onChange={(event) => onChange(Number.parseFloat(event.target.value) || 0)}
          step={step}
          type="number"
          value={value}
        />
      </div>
    </label>
  );
}

function VectorControl({
  label,
  vector,
  range,
  step = 0.1,
  onChange,
}: VectorControlProps) {
  return (
    <fieldset className="vector-fieldset">
      <legend>{label}</legend>
      {(['x', 'y', 'z'] as const).map((axis) => (
        <NumberControl
          key={axis}
          label={axis}
          max={range[1]}
          min={range[0]}
          onChange={(value) => onChange(axis, value)}
          step={step}
          value={vector[axis]}
        />
      ))}
    </fieldset>
  );
}

export function ControlPanel({
  language,
  fields,
  particles,
  activeParticleId,
  presetId,
  isRunning,
  playbackSpeed,
  trailLimit,
  cameraFollow,
  onFieldPresetChange,
  onFieldVectorChange,
  onDensityChange,
  onScaleModeChange,
  onParticleSelect,
  onParticleScalarChange,
  onParticleVectorChange,
  onAddParticle,
  onRemoveParticle,
  onToggleRunning,
  onReset,
  onPlaybackSpeedChange,
  onTrailLimitChange,
  onCameraFollowChange,
  onResetView,
}: ControlPanelProps) {
  const ui = copy[language];
  const activeParticle = particles.find((particle) => particle.id === activeParticleId);

  return (
    <aside className="panel control-panel">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">{ui.panels.controls}</p>
          <h2>{ui.controls.fieldPreset}</h2>
        </div>
      </div>

      <div className="preset-grid">
        {(Object.keys(ui.presetLabels) as FieldPresetId[])
          .filter((key) => key !== 'custom')
          .map((key) => (
          <button
            className={`chip ${presetId === key ? 'chip--active' : ''}`}
            key={key}
            onClick={() => onFieldPresetChange(key)}
            type="button"
          >
            {ui.presetLabels[key]}
          </button>
        ))}
      </div>

      <VectorControl
        label={ui.controls.electricField}
        onChange={(axis, value) => onFieldVectorChange('electric', axis, value)}
        range={[-6, 6]}
        vector={fields.electric}
      />
      <VectorControl
        label={ui.controls.magneticField}
        onChange={(axis, value) => onFieldVectorChange('magnetic', axis, value)}
        range={[-6, 6]}
        vector={fields.magnetic}
      />

      <NumberControl
        label={ui.controls.density}
        max={5}
        min={1}
        onChange={(value) => onDensityChange(Math.round(value))}
        step={1}
        value={fields.density}
      />

      <label className="control">
        <span>{ui.controls.scaleMode}</span>
        <select
          onChange={(event) => onScaleModeChange(event.target.value as ScaleMode)}
          value={fields.scaleMode}
        >
          <option value="teaching">{ui.controls.scaleModeValue.teaching}</option>
          <option value="balanced">{ui.controls.scaleModeValue.balanced}</option>
        </select>
      </label>

      <div className="panel__heading panel__heading--compact">
        <div>
          <p className="eyebrow">{ui.controls.particles}</p>
          <h2>{activeParticle ? particleLabel(activeParticle, language) : ui.controls.particles}</h2>
        </div>
      </div>

      <div className="particle-tabs">
        {particles.map((particle) => (
          <button
            className={`particle-tab ${
              particle.id === activeParticleId ? 'particle-tab--active' : ''
            }`}
            key={particle.id}
            onClick={() => onParticleSelect(particle.id)}
            style={{ '--particle-color': particle.color } as CSSProperties}
            type="button"
          >
            {particleLabel(particle, language)}
          </button>
        ))}
      </div>

      <div className="button-row">
        <button onClick={() => onAddParticle('electron')} type="button">
          {ui.controls.addElectron}
        </button>
        <button onClick={() => onAddParticle('proton')} type="button">
          {ui.controls.addProton}
        </button>
        <button onClick={() => onAddParticle('custom')} type="button">
          {ui.controls.addCustom}
        </button>
      </div>

      {activeParticle && (
        <>
          <NumberControl
            label={ui.controls.mass}
            max={20}
            min={0.4}
            onChange={(value) =>
              onParticleScalarChange(activeParticle.id, 'mass', Math.max(value, 0.4))
            }
            value={activeParticle.mass}
          />
          <NumberControl
            label={ui.controls.charge}
            max={3}
            min={-3}
            onChange={(value) => onParticleScalarChange(activeParticle.id, 'charge', value)}
            value={activeParticle.charge}
          />
          <VectorControl
            label={ui.controls.initialPosition}
            onChange={(axis, value) =>
              onParticleVectorChange(activeParticle.id, 'position', axis, value)
            }
            range={[-5, 5]}
            vector={activeParticle.position}
          />
          <VectorControl
            label={ui.controls.initialVelocity}
            onChange={(axis, value) =>
              onParticleVectorChange(activeParticle.id, 'velocity', axis, value)
            }
            range={[-6, 6]}
            vector={activeParticle.velocity}
          />
          <button
            className="danger-button"
            disabled={particles.length === 1}
            onClick={() => onRemoveParticle(activeParticle.id)}
            type="button"
          >
            {ui.controls.removeParticle}
          </button>
        </>
      )}

      <div className="panel__heading panel__heading--compact">
        <div>
          <p className="eyebrow">{ui.controls.playback}</p>
          <h2>{isRunning ? ui.controls.play : ui.controls.pause}</h2>
        </div>
      </div>

      <div className="button-row">
        <button className="primary-button" onClick={onToggleRunning} type="button">
          {isRunning ? ui.controls.pause : ui.controls.play}
        </button>
        <button onClick={onReset} type="button">
          {ui.controls.reset}
        </button>
      </div>

      <NumberControl
        label={ui.controls.speed}
        max={4}
        min={0.25}
        onChange={onPlaybackSpeedChange}
        step={0.25}
        value={playbackSpeed}
      />
      <NumberControl
        label={ui.controls.trail}
        max={220}
        min={40}
        onChange={(value) => onTrailLimitChange(Math.round(value))}
        step={10}
        value={trailLimit}
      />

      <label className="toggle">
        <input
          checked={cameraFollow}
          onChange={(event) => onCameraFollowChange(event.target.checked)}
          type="checkbox"
        />
        <span>{ui.controls.cameraFollow}</span>
      </label>
      <button onClick={onResetView} type="button">
        {ui.controls.resetView}
      </button>
    </aside>
  );
}
