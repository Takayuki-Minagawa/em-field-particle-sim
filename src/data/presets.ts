import type {
  FieldPreset,
  Fields,
  Language,
  ParticleConfig,
  ParticleTemplateId,
} from '../lib/types';

const colors = ['#ff6b57', '#23b5d3', '#ffb84d', '#63c132', '#ff6ec7', '#8e9bff'];

export const defaultFields: Fields = {
  electric: { x: 0, y: 1.8, z: 0 },
  magnetic: { x: 0, y: 0, z: 2.2 },
  density: 3,
  scaleMode: 'teaching',
};

export const fieldPresets: FieldPreset[] = [
  {
    id: 'electric',
    electric: { x: 2.5, y: 0, z: 0 },
    magnetic: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'magnetic',
    electric: { x: 0, y: 0, z: 0 },
    magnetic: { x: 0, y: 0, z: 2.8 },
    recommendedVelocity: { x: 2.8, y: 0, z: 0.6 },
  },
  {
    id: 'parallel',
    electric: { x: 0, y: 0, z: 2.3 },
    magnetic: { x: 0, y: 0, z: 1.8 },
    recommendedVelocity: { x: 1.4, y: 0.4, z: 1.8 },
  },
  {
    id: 'orthogonal',
    electric: { x: 0, y: 1.8, z: 0 },
    magnetic: { x: 0, y: 0, z: 2.2 },
    recommendedVelocity: { x: 2.2, y: 0.3, z: 0 },
  },
  {
    id: 'selector',
    electric: { x: 0, y: 2.2, z: 0 },
    magnetic: { x: 0, y: 0, z: 2.0 },
    recommendedVelocity: { x: 1.1, y: 0, z: 0 },
  },
];

const templateDefaults: Record<
  ParticleTemplateId,
  Omit<ParticleConfig, 'id' | 'serial' | 'color'>
> = {
  electron: {
    templateId: 'electron',
    mass: 1,
    charge: -1,
    position: { x: -3.5, y: 0, z: 0 },
    velocity: { x: 2.3, y: 0.2, z: 0 },
  },
  proton: {
    templateId: 'proton',
    mass: 8,
    charge: 1,
    position: { x: -3.5, y: -0.8, z: 0 },
    velocity: { x: 1.4, y: 0.1, z: 0 },
  },
  alpha: {
    templateId: 'alpha',
    mass: 14,
    charge: 2,
    position: { x: -3.5, y: 0.8, z: 0 },
    velocity: { x: 1.2, y: 0, z: 0.1 },
  },
  custom: {
    templateId: 'custom',
    mass: 4,
    charge: 1,
    position: { x: -3.5, y: 1.6, z: 0 },
    velocity: { x: 1.6, y: 0, z: 0 },
    customLabel: 'Custom',
  },
};

export function particleColor(index: number): string {
  return colors[index % colors.length];
}

export function createParticle(
  templateId: ParticleTemplateId,
  serial: number,
): ParticleConfig {
  const defaults = templateDefaults[templateId];

  return {
    id: `${templateId}-${serial}`,
    serial,
    color: particleColor(serial),
    ...defaults,
  };
}

export function createDefaultParticles(): ParticleConfig[] {
  return [createParticle('electron', 0), createParticle('proton', 1)];
}

export function particleLabel(
  particle: ParticleConfig,
  language: Language,
): string {
  if (particle.templateId === 'custom') {
    return particle.customLabel ??
      (language === 'ja' ? `比較粒子 ${particle.serial + 1}` : `Custom ${particle.serial + 1}`);
  }

  const templates =
    language === 'ja'
      ? {
          electron: '電子',
          proton: '陽子',
          alpha: 'アルファ粒子',
        }
      : {
          electron: 'Electron',
          proton: 'Proton',
          alpha: 'Alpha particle',
        };

  return `${templates[particle.templateId]} ${particle.serial + 1}`;
}
