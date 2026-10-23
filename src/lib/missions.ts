import type {
  Fields,
  Language,
  Localized,
  ParticleState,
  ScenarioSetup,
  Vector3,
} from './types';
import { lorentzForce } from './physics';
import { EPSILON, clamp, cross, distance, dot, magnitude, normalize, scale } from './vector';

export type MissionTarget = {
  kind: 'orb' | 'gate';
  position: Vector3;
  radius: number;
  normal?: Vector3;
};

export type MissionContext = {
  particle: ParticleState;
  fields: Fields;
  time: number;
  language: Language;
};

export type MissionStatus = {
  complete: boolean;
  progress: number;
  readout: string;
  warning?: string;
};

export type Mission = {
  id: string;
  icon: string;
  difficulty: 1 | 2 | 3;
  title: Localized;
  story: Localized;
  goal: Localized;
  hint: Localized;
  setup: ScenarioSetup;
  target?: MissionTarget;
  evaluate: (context: MissionContext) => MissionStatus;
};

const ZERO: Vector3 = { x: 0, y: 0, z: 0 };

function f(value: number, digits = 2) {
  return value.toFixed(digits);
}

function t(language: Language, ja: string, en: string) {
  return language === 'ja' ? ja : en;
}

function velocityComponents(velocity: Vector3, magnetic: Vector3) {
  const unit = normalize(magnetic);
  const parallel = dot(velocity, unit);
  const perpendicular = Math.sqrt(Math.max(dot(velocity, velocity) - parallel * parallel, 0));
  return { parallel, perpendicular };
}

export function exbDrift(fields: Fields): Vector3 {
  const b2 = dot(fields.magnetic, fields.magnetic);
  if (b2 < EPSILON) {
    return { ...ZERO };
  }

  return scale(cross(fields.electric, fields.magnetic), 1 / b2);
}

export function closestApproach(trail: Vector3[], target: Vector3): number {
  return trail.reduce((best, point) => Math.min(best, distance(point, target)), Infinity);
}

const DEFLECT_TARGET: Vector3 = { x: 2, y: -3, z: 0 };
const SELECTOR_GATE: Vector3 = { x: 4, y: 0, z: 0 };
// Target radius plus roughly the drawn particle radius, so a visible overlap counts as a hit.
const DEFLECT_HIT_RADIUS = 0.65;

export const missions: Mission[] = [
  {
    id: 'accelerate',
    icon: '🚀',
    difficulty: 1,
    title: { ja: '電場ロケット', en: 'Electric rocket' },
    story: {
      ja: '止まっている陽子を、電場の力だけで発射しよう！',
      en: 'Launch a resting proton using nothing but an electric field!',
    },
    goal: {
      ja: '初速度 0 のまま、x = 4 に着くまでに速さ 4 以上にする',
      en: 'Starting from rest, reach a speed of 4 or more before x = 4',
    },
    hint: {
      ja: '加速度 a = qE/m。電場 E の x 成分を強くするか、質量を小さく、電荷を大きくしてみよう。',
      en: 'Acceleration a = qE/m. Strengthen the x-component of E, or reduce the mass / increase the charge.',
    },
    setup: {
      electric: { x: 0.5, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 0 },
      particles: [
        { templateId: 'proton', mass: 1, position: { x: -4, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
      ],
    },
    evaluate: ({ particle, language }) => {
      const launched = magnitude(particle.launch.velocity) > 0.05;
      const passed = particle.position.x > 4.3;
      // Only speed toward +x counts: the goal is to arrive at x = 4.
      const forward = particle.velocity.x;
      const progress = clamp(forward / 4, 0, 1);
      const readout = t(
        language,
        `+x 向きの速さ ${f(forward)} / 目標 4.00 （x = ${f(particle.position.x)}）`,
        `Speed toward +x ${f(forward)} / goal 4.00 (x = ${f(particle.position.x)})`,
      );

      if (launched) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '初速度は 0 に戻そう！', 'Set the initial velocity back to 0!'),
        };
      }

      if (passed && forward < 4) {
        return {
          complete: false,
          progress,
          readout,
          warning: t(
            language,
            'x = 4 を通過してしまった… 加速を強くして再挑戦！',
            'Passed x = 4 too slowly. Boost the acceleration and retry!',
          ),
        };
      }

      return { complete: forward >= 4 && !passed, progress, readout };
    },
  },
  {
    id: 'deflect',
    icon: '🎯',
    difficulty: 1,
    title: { ja: '放物線シュート', en: 'Parabolic shot' },
    story: {
      ja: '下向きの電場は、まるで重力。ボールを投げるように陽子を的へ当てよう！',
      en: 'A downward electric field acts like gravity. Throw the proton into the target like a ball!',
    },
    goal: {
      ja: '光る的（x = 2, y = -3）に粒子を当てる',
      en: 'Hit the glowing target at (x = 2, y = -3)',
    },
    hint: {
      ja: '初速度の x 成分を少しずつ上げてみよう。電場を弱くしても飛距離が伸びるよ。',
      en: 'Nudge up the x-component of the initial velocity. A weaker field also makes it fly farther.',
    },
    setup: {
      electric: { x: 0, y: -1, z: 0 },
      magnetic: { x: 0, y: 0, z: 0 },
      particles: [
        { templateId: 'proton', mass: 1, position: { x: -4, y: 0, z: 0 }, velocity: { x: 1.5, y: 0, z: 0 } },
      ],
    },
    target: { kind: 'orb', position: DEFLECT_TARGET, radius: 0.45 },
    evaluate: ({ particle, fields, language }) => {
      const closest = closestApproach(
        [...particle.trail, particle.position],
        DEFLECT_TARGET,
      );
      // The field must pull downward like gravity; a sideways field would allow a straight shot.
      if (-fields.electric.y < 0.3) {
        return {
          complete: false,
          progress: 0,
          readout: t(language, `的までの距離 ${f(closest)}`, `Distance to target ${f(closest)}`),
          warning: t(
            language,
            '電場を「重力」として使おう（-y 向きの成分を残す）',
            'Use the electric field as your "gravity" (keep a -y component)',
          ),
        };
      }

      if (distance(particle.launch.position, DEFLECT_TARGET) < 2) {
        return {
          complete: false,
          progress: 0,
          readout: t(language, `的までの距離 ${f(closest)}`, `Distance to target ${f(closest)}`),
          warning: t(
            language,
            'スタート地点を的から離そう（ずるはなし！）',
            'Start farther from the target (no shortcuts!)',
          ),
        };
      }

      return {
        complete: closest <= DEFLECT_HIT_RADIUS,
        progress: clamp(1 - (closest - DEFLECT_HIT_RADIUS) / 5, 0, 1),
        readout: t(
          language,
          `的までの距離 ${f(closest)}`,
          `Distance to target ${f(closest)}`,
        ),
      };
    },
  },
  {
    id: 'circle',
    icon: '⭕',
    difficulty: 2,
    title: { ja: 'ぴったり半径 2', en: 'Radius exactly 2' },
    story: {
      ja: '磁場の中で、電子にきれいな円を描かせよう。サイズ指定は半径 2！',
      en: 'Make an electron draw a neat circle in the magnetic field. The order: radius 2!',
    },
    goal: {
      ja: '磁場だけの中で、半径 2.00 ± 0.15 の円運動をさせる',
      en: 'Make a circle of radius 2.00 ± 0.15 in a magnetic field only',
    },
    hint: {
      ja: 'r = mv/(qB)。速さを 2 倍にするか、磁場を半分にすると半径は 2 倍になるよ。',
      en: 'r = mv/(qB). Doubling the speed or halving B doubles the radius.',
    },
    setup: {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 1 },
      particles: [
        { templateId: 'electron', position: { x: 0, y: 0, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
      ],
    },
    evaluate: ({ particle, fields, time, language }) => {
      const radius = particle.cyclotronRadius;
      const { parallel } = velocityComponents(particle.velocity, fields.magnetic);
      const readout = t(
        language,
        `半径 r = ${radius === null ? '--' : f(radius)} / 目標 2.00`,
        `Radius r = ${radius === null ? '--' : f(radius)} / goal 2.00`,
      );

      if (magnitude(fields.electric) > 0.05) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '電場は 0 にしよう', 'Keep the electric field at 0'),
        };
      }

      if (radius === null) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '磁場と電荷が必要です', 'You need a magnetic field and a charge'),
        };
      }

      if (Math.abs(parallel) > 0.15) {
        return {
          complete: false,
          progress: 0.5,
          readout,
          warning: t(
            language,
            '磁場方向の速度があると「らせん」になってしまう',
            'Velocity along B turns the circle into a helix',
          ),
        };
      }

      return {
        complete: Math.abs(radius - 2) <= 0.15 && time >= 2,
        progress: clamp(1 - Math.abs(radius - 2) / 2, 0, 1),
        readout,
      };
    },
  },
  {
    id: 'helix',
    icon: '🌀',
    difficulty: 2,
    title: { ja: 'らせんを描け', en: 'Draw a helix' },
    story: {
      ja: '今は同じ場所をぐるぐる回るだけ。磁場の向き（z 軸）に沿って進む、らせんを描かせよう！',
      en: 'Right now it only circles in place. Make it spiral along the magnetic field (the z axis)!',
    },
    goal: {
      ja: 'v∥（磁場方向の速さ）0.5 以上、v⊥ 0.5 以上で 1 周以上らせんを描く',
      en: 'Spiral for at least one turn with v∥ ≥ 0.5 and v⊥ ≥ 0.5',
    },
    hint: {
      ja: '磁場は +z 向き。初速度に z 成分を加えると、その成分は力を受けずに保たれるよ。',
      en: 'B points in +z. Add a z-component to the initial velocity; that part feels no force.',
    },
    setup: {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 2 },
      particles: [
        { templateId: 'proton', mass: 1, position: { x: 0, y: 0, z: -4 }, velocity: { x: 2, y: 0, z: 0 } },
      ],
    },
    evaluate: ({ particle, fields, time, language }) => {
      const { parallel, perpendicular } = velocityComponents(particle.velocity, fields.magnetic);
      const period = particle.cyclotronPeriod;
      const readout = t(
        language,
        `v∥ = ${f(Math.abs(parallel))}　v⊥ = ${f(perpendicular)}`,
        `v∥ = ${f(Math.abs(parallel))}   v⊥ = ${f(perpendicular)}`,
      );

      if (magnitude(fields.electric) > 0.05) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '電場は 0 にしよう', 'Keep the electric field at 0'),
        };
      }

      const shapeOk = Math.abs(parallel) >= 0.5 && perpendicular >= 0.5;
      const turns = period ? time / period : 0;

      return {
        complete: shapeOk && turns >= 1,
        progress: shapeOk ? clamp(0.5 + turns / 2, 0, 1) : clamp(Math.abs(parallel), 0, 0.5),
        readout,
      };
    },
  },
  {
    id: 'selector',
    icon: '🚪',
    difficulty: 3,
    title: { ja: 'まっすぐゲートを通せ', en: 'Thread the gate' },
    story: {
      ja: '電場と磁場が待ち構える通路。まっすぐ進めた粒子だけが出口のゲートをくぐれる！',
      en: 'A corridor guarded by electric and magnetic fields. Only a perfectly straight shot gets through the exit gate!',
    },
    goal: {
      ja: '電場と磁場を残したまま、x = 4 のゲートを通過させる',
      en: 'Keep both fields on and pass through the gate at x = 4',
    },
    hint: {
      ja: '電気力と磁気力がつり合う条件は qE = qvB。v = E/B になるように初速度を調整しよう。',
      en: 'Forces balance when qE = qvB. Tune the launch speed so that v = E/B.',
    },
    setup: {
      electric: { x: 0, y: 2, z: 0 },
      magnetic: { x: 0, y: 0, z: 1 },
      particles: [
        { templateId: 'proton', mass: 1, position: { x: -4, y: 0, z: 0 }, velocity: { x: 1.2, y: 0, z: 0 } },
      ],
    },
    target: { kind: 'gate', position: SELECTOR_GATE, radius: 0.5, normal: { x: 1, y: 0, z: 0 } },
    evaluate: ({ particle, fields, language }) => {
      // Judge by the field balance at launch: a cycloid also returns to y = 0
      // periodically, but only a balanced launch travels in a straight line.
      // Using E + v × B (force per charge) keeps the tolerance independent of q.
      const imbalance = magnitude(lorentzForce(1, particle.launch.velocity, fields));
      const readout = t(
        language,
        `発射時の |E + v × B| = ${f(imbalance)}（0 に近づけよう）`,
        `|E + v × B| at launch = ${f(imbalance)} (bring it to 0)`,
      );

      if (magnitude(fields.electric) < 0.5 || magnitude(fields.magnetic) < 0.5) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '電場と磁場はどちらも残そう', 'Keep both fields switched on'),
        };
      }

      if (particle.launch.position.x > 2) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, 'スタート地点はゲートから離そう', 'Start farther from the gate'),
        };
      }

      if (Math.abs(particle.charge) < 0.5) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(
            language,
            '電荷が 0 に近いと力を受けないだけ。電荷は残そう',
            'With almost no charge it simply feels no force. Keep the charge',
          ),
        };
      }

      const throughGate =
        particle.position.x >= 3.8 &&
        Math.abs(particle.position.y - SELECTOR_GATE.y) <= 0.5 &&
        Math.abs(particle.position.z - SELECTOR_GATE.z) <= 0.5;

      return {
        complete: imbalance <= 0.1 && throughGate,
        progress: clamp(1 - imbalance / 3, 0, 1),
        readout,
      };
    },
  },
  {
    id: 'drift',
    icon: '🌊',
    difficulty: 3,
    title: { ja: '流れを逆転させよ', en: 'Reverse the drift' },
    story: {
      ja: '電子は E × B ドリフトで +x 向きに流されてしまう。流れの向きを逆にして、左の岸（x ≤ -1）まで運ぼう！',
      en: 'The E × B drift carries the electron toward +x. Reverse the flow and bring it to the left shore (x ≤ -1)!',
    },
    goal: {
      ja: '電場と磁場を残したまま、ドリフトで -x 向きに 3 以上流して x ≤ -1 まで運ぶ',
      en: 'With both fields on, drift the electron at least 3 units toward -x, to x ≤ -1',
    },
    hint: {
      ja: 'v_d = E × B / B²。電荷の符号を変えてもドリフトの向きは変わらない…では何を変える？',
      en: 'v_d = E × B / B². Flipping the charge sign does not change the drift... so what should you flip?',
    },
    setup: {
      electric: { x: 0, y: 1.5, z: 0 },
      magnetic: { x: 0, y: 0, z: 1.5 },
      particles: [
        { templateId: 'electron', position: { x: 3, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
      ],
    },
    evaluate: ({ particle, fields, language }) => {
      const drift = exbDrift(fields);
      const readout = t(
        language,
        `ドリフト v_d = (${f(drift.x)}, ${f(drift.y)}, ${f(drift.z)})　x = ${f(particle.position.x)}`,
        `Drift v_d = (${f(drift.x)}, ${f(drift.y)}, ${f(drift.z)})   x = ${f(particle.position.x)}`,
      );

      if (magnitude(fields.electric) < 0.5 || magnitude(fields.magnetic) < 0.5) {
        return {
          complete: false,
          progress: 0,
          readout,
          warning: t(language, '電場と磁場はどちらも残そう', 'Keep both fields switched on'),
        };
      }

      if (drift.x > -0.3) {
        return { complete: false, progress: 0.1, readout };
      }

      // The drift itself must carry the particle at least 3 units, wherever it starts.
      const start = particle.launch.position.x;
      const travelled = start - particle.position.x;
      const needed = Math.max(3, start + 1);
      return {
        complete: particle.position.x <= -1 && travelled >= 3,
        progress: clamp(0.3 + (0.7 * travelled) / needed, 0, 1),
        readout,
      };
    },
  },
];
