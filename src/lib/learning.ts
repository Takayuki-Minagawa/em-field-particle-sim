import { particleLabel } from '../data/presets';
import type {
  Fields,
  Language,
  ParticleConfig,
  ParticleState,
  QuizQuestion,
} from './types';
import {
  EPSILON,
  cross,
  dot,
  magnitude,
  nearestAxisLabel,
  normalize,
  project,
} from './vector';

function format(value: number, digits = 2): string {
  return value.toFixed(digits);
}

type MotionScenario =
  | 'none'
  | 'electric'
  | 'magnetic'
  | 'parallel'
  | 'orthogonal'
  | 'mixed';

function scenario(fields: Fields): MotionScenario {
  const electricMagnitude = magnitude(fields.electric);
  const magneticMagnitude = magnitude(fields.magnetic);

  if (electricMagnitude > EPSILON && magneticMagnitude < EPSILON) {
    return 'electric';
  }

  if (magneticMagnitude > EPSILON && electricMagnitude < EPSILON) {
    return 'magnetic';
  }

  if (electricMagnitude < EPSILON && magneticMagnitude < EPSILON) {
    return 'none';
  }

  const alignment =
    Math.abs(dot(normalize(fields.electric), normalize(fields.magnetic)));

  if (alignment > 0.88) {
    return 'parallel';
  }

  if (alignment < 0.2) {
    return 'orthogonal';
  }

  return 'mixed';
}

export function buildExplanation(
  language: Language,
  fields: Fields,
  particle: ParticleState,
): string[] {
  const electricMagnitude = magnitude(fields.electric);
  const magneticMagnitude = magnitude(fields.magnetic);
  const forceMagnitude = magnitude(particle.force);
  const drift = magneticMagnitude > EPSILON
    ? cross(fields.electric, fields.magnetic)
    : { x: 0, y: 0, z: 0 };
  const driftMagnitude =
    magneticMagnitude > EPSILON
      ? magnitude(drift) / (magneticMagnitude * magneticMagnitude)
      : 0;
  const motionScenario = scenario(fields);
  const label = particleLabel(particle, language);
  const velocityParallel = project(particle.velocity, fields.magnetic);
  const velocityPerpendicular = {
    x: particle.velocity.x - velocityParallel.x,
    y: particle.velocity.y - velocityParallel.y,
    z: particle.velocity.z - velocityParallel.z,
  };

  if (language === 'ja') {
    const descriptions: Record<typeof motionScenario, string> = {
      none: `${label} にはほぼ力が働いていません。電場も磁場もないので、粒子は現在の速度を保ったまま等速直線運動を続けます。`,
      electric: `${label} は電場のみを受けており、加速度の向きはほぼ電場と同じです。荷電粒子の電荷が負なら加速度の向きは反転します。`,
      magnetic: `${label} は磁場のみを受けています。ローレンツ力は速度に垂直なので、速さはほぼ一定のまま向きだけが変わり、円運動またはらせん運動になります。`,
      parallel: `電場と磁場がほぼ平行です。磁場は横向き成分を曲げ、電場は磁場方向の速度成分を増減させるため、らせんの巻き方が変化します。`,
      orthogonal: `電場と磁場がほぼ直交しています。速度が E x B 方向に近いと、力がつり合って直進に近づき、ずれるとサイクロイドやドリフトが見えます。`,
      mixed: `電場と磁場が混在する一般的な 3D 運動です。どの成分が速度を変え、どの成分が向きを曲げているかを分けて見ると理解しやすくなります。`,
    };

    return [
      descriptions[motionScenario],
      `現在の速さは ${format(particle.speed)}、ローレンツ力の大きさは ${format(forceMagnitude)} です。電場の大きさ ${format(electricMagnitude)}、磁場の大きさ ${format(magneticMagnitude)} を比較すると、どちらが軌道に強く効いているか判断できます。`,
      particle.cyclotronRadius
        ? `磁場に垂直な速度成分は ${format(magnitude(velocityPerpendicular))} で、推定半径は ${format(particle.cyclotronRadius)}、周期は ${format(particle.cyclotronPeriod ?? 0)} です。`
        : '磁場が弱いか電荷が 0 に近いため、サイクロトロン半径と周期は定義されません。',
      driftMagnitude > EPSILON
        ? `E x B ドリフトの代表速度は ${format(driftMagnitude)} 程度です。粒子の電荷符号が変わっても、このドリフト速度自体は変わりません。`
        : 'E x B ドリフトはほぼ 0 です。電場か磁場が弱い、または両者が平行に近いことを意味します。',
    ];
  }

  const descriptions: Record<typeof motionScenario, string> = {
    none:
      `${label} is effectively force-free here. With no electric or magnetic field, it continues in uniform straight-line motion at its current velocity.`,
    electric:
      `${label} is mainly driven by the electric field, so its acceleration points along the field for positive charge and opposite for negative charge.`,
    magnetic:
      `${label} is moving in a magnetic field only. The Lorentz force stays perpendicular to velocity, so the speed stays nearly constant while the direction bends into a circle or helix.`,
    parallel:
      'The electric and magnetic fields are nearly parallel. The magnetic field bends transverse motion while the electric field changes the component along the field, so the helix pitch evolves.',
    orthogonal:
      'The electric and magnetic fields are nearly orthogonal. If the velocity approaches the E x B direction, forces can balance and the path becomes straighter; otherwise you see drift or cycloid-like motion.',
    mixed:
      'This is a general 3D mixed-field trajectory. Separate the part of the force that changes speed from the part that bends direction to interpret the motion.',
  };

  return [
    descriptions[motionScenario],
    `The current speed is ${format(particle.speed)} and the Lorentz-force magnitude is ${format(forceMagnitude)}. Compare |E| = ${format(electricMagnitude)} with |B| = ${format(magneticMagnitude)} to see which field dominates.`,
    particle.cyclotronRadius
      ? `The velocity component perpendicular to B is ${format(magnitude(velocityPerpendicular))}, giving an estimated radius of ${format(particle.cyclotronRadius)} and period of ${format(particle.cyclotronPeriod ?? 0)}.`
      : 'The cyclotron radius and period are undefined here because the magnetic field or charge is too small.',
    driftMagnitude > EPSILON
      ? `The representative E x B drift speed is about ${format(driftMagnitude)}. Its value does not depend on the sign of the particle charge.`
      : 'The E x B drift is almost zero here, which means the electric field is weak, the magnetic field is weak, or the two fields are nearly parallel.',
  ];
}

function axisOptions(language: Language) {
  return language === 'ja'
    ? [
        { id: 'px', label: '+x 方向' },
        { id: 'nx', label: '-x 方向' },
        { id: 'py', label: '+y 方向' },
        { id: 'ny', label: '-y 方向' },
        { id: 'pz', label: '+z 方向' },
        { id: 'nz', label: '-z 方向' },
        { id: 'zero', label: 'ほぼ 0' },
      ]
    : [
        { id: 'px', label: '+x direction' },
        { id: 'nx', label: '-x direction' },
        { id: 'py', label: '+y direction' },
        { id: 'ny', label: '-y direction' },
        { id: 'pz', label: '+z direction' },
        { id: 'nz', label: '-z direction' },
        { id: 'zero', label: 'near zero' },
      ];
}

function axisId(v: string): string {
  if (v.startsWith('+x')) return 'px';
  if (v.startsWith('-x')) return 'nx';
  if (v.startsWith('+y')) return 'py';
  if (v.startsWith('-y')) return 'ny';
  if (v.startsWith('+z')) return 'pz';
  if (v.startsWith('-z')) return 'nz';
  return 'zero';
}

export function buildQuiz(
  language: Language,
  fields: Fields,
  particle: ParticleState,
): QuizQuestion[] {
  const forceDirection = nearestAxisLabel(particle.force, language);
  const radius = particle.cyclotronRadius;
  const selectorSpeed =
    magnitude(fields.magnetic) > EPSILON
      ? magnitude(fields.electric) / magnitude(fields.magnetic)
      : 0;

  if (language === 'ja') {
    return [
      {
        id: 'force-direction',
        prompt: '現在のローレンツ力の向きに最も近いものはどれですか。',
        options: axisOptions(language),
        correctId: axisId(forceDirection),
        explanation: `現在の力ベクトルは ${forceDirection} に最も近く、電荷の符号を含めた q(E + v x B) の結果になっています。`,
      },
      radius
        ? {
            id: 'cyclotron-radius',
            prompt: `現在の条件での半径 r = mv_perp / (|q|B) の見積もりとして最も近いものを選んでください。`,
            options: [
              { id: 'half', label: format(radius / 2) },
              { id: 'exact', label: format(radius) },
              { id: 'double', label: format(radius * 2) },
              { id: 'triple', label: format(radius * 3) },
            ],
            correctId: 'exact',
            explanation: `現在は m = ${format(particle.mass)}, |q| = ${format(Math.abs(particle.charge))}, r ≈ ${format(radius)} です。`,
          }
        : {
            id: 'cyclotron-radius',
            prompt: 'この条件でサイクロトロン半径が定義しにくい主な理由はどれですか。',
            options: [
              { id: 'weakB', label: '磁場または電荷がほぼ 0 だから' },
              { id: 'largeMass', label: '質量が大きいから' },
              { id: 'positiveCharge', label: '正電荷だから' },
              { id: 'highSpeed', label: '速度が大きいから' },
            ],
            correctId: 'weakB',
            explanation: '半径 r = mv_perp / (|q|B) は、B または q が 0 に近いと定義できません。',
          },
      {
        id: 'velocity-selector',
        prompt: '速度選別器で粒子が直進しやすい条件はどれですか。',
        options: [
          { id: 'selector', label: `v = E / B ≈ ${format(selectorSpeed)}` },
          { id: 'inverse', label: `v = B / E ≈ ${format(selectorSpeed > EPSILON ? 1 / selectorSpeed : 0)}` },
          { id: 'charge', label: 'v = qE / B' },
          { id: 'period', label: 'v = 2πm / (qB)' },
        ],
        correctId: 'selector',
        explanation: '直進条件は電気力と磁気力がつり合う qE = qvB で、v = E/B です。',
      },
    ];
  }

  return [
    {
      id: 'force-direction',
      prompt: 'Which option best matches the current Lorentz-force direction?',
      options: axisOptions(language),
      correctId: axisId(forceDirection),
      explanation: `The current force vector is closest to ${forceDirection}, based on q(E + v x B) including the sign of the charge.`,
    },
    radius
      ? {
          id: 'cyclotron-radius',
          prompt: 'Using r = mv_perp / (|q|B), which estimate is closest to the current radius?',
          options: [
            { id: 'half', label: format(radius / 2) },
            { id: 'exact', label: format(radius) },
            { id: 'double', label: format(radius * 2) },
            { id: 'triple', label: format(radius * 3) },
          ],
          correctId: 'exact',
          explanation: `With m = ${format(particle.mass)} and |q| = ${format(Math.abs(particle.charge))}, the current estimate is about ${format(radius)}.`,
        }
      : {
          id: 'cyclotron-radius',
          prompt: 'Why is the cyclotron radius not well defined under the current setting?',
          options: [
            { id: 'weakB', label: 'The magnetic field or charge is near zero.' },
            { id: 'largeMass', label: 'The mass is too large.' },
            { id: 'positiveCharge', label: 'The particle is positively charged.' },
            { id: 'highSpeed', label: 'The speed is too high.' },
          ],
          correctId: 'weakB',
          explanation: 'The formula r = mv_perp / (|q|B) becomes undefined when B or q approaches zero.',
        },
    {
      id: 'velocity-selector',
      prompt: 'Which condition lets a charged particle pass straight through a velocity selector?',
      options: [
        { id: 'selector', label: `v = E / B ≈ ${format(selectorSpeed)}` },
        { id: 'inverse', label: `v = B / E ≈ ${format(selectorSpeed > EPSILON ? 1 / selectorSpeed : 0)}` },
        { id: 'charge', label: 'v = qE / B' },
        { id: 'period', label: 'v = 2πm / (qB)' },
      ],
      correctId: 'selector',
      explanation: 'The straight-through condition is qE = qvB, which reduces to v = E/B.',
    },
  ];
}

export function activeParticleLabel(
  language: Language,
  particle: ParticleConfig | ParticleState,
): string {
  return particleLabel(particle, language);
}
