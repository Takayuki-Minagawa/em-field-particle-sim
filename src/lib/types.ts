export type Language = 'ja' | 'en';
export type Theme = 'light' | 'dark';
export type FieldPresetId =
  | 'electric'
  | 'magnetic'
  | 'parallel'
  | 'orthogonal'
  | 'selector'
  | 'custom';
export type ParticleTemplateId = 'electron' | 'proton' | 'alpha' | 'custom';
export type ScaleMode = 'teaching' | 'balanced';

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type Fields = {
  electric: Vector3;
  magnetic: Vector3;
  density: number;
  scaleMode: ScaleMode;
};

export type ParticleConfig = {
  id: string;
  serial: number;
  templateId: ParticleTemplateId;
  color: string;
  mass: number;
  charge: number;
  position: Vector3;
  velocity: Vector3;
  customLabel?: string;
};

export type ParticleState = ParticleConfig & {
  force: Vector3;
  acceleration: Vector3;
  speed: number;
  kineticEnergy: number;
  cyclotronRadius: number | null;
  cyclotronPeriod: number | null;
  trail: Vector3[];
};

export type MetricPoint = {
  time: number;
  speed: number;
  kineticEnergy: number;
  radius: number | null;
  period: number | null;
  position: number;
  acceleration: number;
};

export type SimulationState = {
  time: number;
  particles: ParticleState[];
  history: Record<string, MetricPoint[]>;
};

export type FieldPreset = {
  id: FieldPresetId;
  electric: Vector3;
  magnetic: Vector3;
  recommendedVelocity?: Vector3;
};

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
};
