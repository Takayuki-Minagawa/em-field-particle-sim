import type { Language, Localized, ScenarioSetup } from '../lib/types';

export type LessonOption = {
  id: string;
  label: Localized;
};

export type Lesson = {
  id: string;
  icon: string;
  title: Localized;
  idea: Localized;
  formula: string;
  points: Record<Language, string[]>;
  prediction: {
    prompt: Localized;
    options: LessonOption[];
    correctId: string;
    explanation: Localized;
  };
  observe: Localized;
  tryNext: Localized;
  setup: ScenarioSetup;
};

export const lessons: Lesson[] = [
  {
    id: 'electric-force',
    icon: '⚡',
    title: {
      ja: '電場から受ける力',
      en: 'Force from an electric field',
    },
    idea: {
      ja: '電場 E の中に置かれた電荷 q は、F = qE の力を受けます。正電荷は電場の向き、負電荷は電場と逆向きに押されます。',
      en: 'A charge q in an electric field E feels a force F = qE. Positive charges are pushed along the field, negative charges the opposite way.',
    },
    formula: 'F = qE',
    points: {
      ja: [
        '力の向きは「電荷の符号」で決まる',
        '同じ力でも、質量が小さいほど大きく加速する（a = qE / m）',
        '電場は粒子の「速さ」を変えることができる',
      ],
      en: [
        'The sign of the charge decides the direction of the force',
        'With the same force, a lighter particle accelerates more (a = qE / m)',
        'An electric field can change the particle speed',
      ],
    },
    prediction: {
      prompt: {
        ja: '+x 向きの電場の中で、静止している電子（負電荷）はどちらへ動き出すでしょう？',
        en: 'An electron (negative charge) is at rest in a +x electric field. Which way does it start moving?',
      },
      options: [
        { id: 'px', label: { ja: '+x 方向（電場と同じ向き）', en: '+x (along the field)' } },
        { id: 'nx', label: { ja: '-x 方向（電場と逆向き）', en: '-x (against the field)' } },
        { id: 'stay', label: { ja: '止まったまま', en: 'It stays still' } },
      ],
      correctId: 'nx',
      explanation: {
        ja: '電子は q < 0 なので F = qE は電場と逆向き。陽子は電場の向きに動くので、2 つの粒子は反対方向へ進みます。',
        en: 'The electron has q < 0, so F = qE points against the field. The proton moves along the field, so the two particles head in opposite directions.',
      },
    },
    observe: {
      ja: '電子と陽子が逆向きに加速する様子と、軽い電子のほうがずっと速く加速する様子を見比べましょう。',
      en: 'Compare how the electron and proton accelerate in opposite directions, and how the light electron speeds up much faster.',
    },
    tryNext: {
      ja: '電場 E の x 成分を大きくしたり、向きを反転させたりしてみよう。',
      en: 'Try making the x-component of E larger, or flip its sign.',
    },
    setup: {
      electric: { x: 1.5, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 0 },
      particles: [
        { templateId: 'electron', position: { x: 2, y: 1, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
        { templateId: 'proton', position: { x: -2, y: -1, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
      ],
    },
  },
  {
    id: 'magnetic-force',
    icon: '🧲',
    title: {
      ja: '磁場から受ける力（ローレンツ力）',
      en: 'Force from a magnetic field (Lorentz force)',
    },
    idea: {
      ja: '磁場 B の中を速度 v で動く電荷は F = qv × B の力を受けます。この力はいつも速度に垂直です。',
      en: 'A charge moving with velocity v in a magnetic field B feels F = qv × B. This force is always perpendicular to the velocity.',
    },
    formula: 'F = qv × B',
    points: {
      ja: [
        'フレミングの左手の法則：中指＝正電荷の速度、人差し指＝磁場、親指＝力',
        '止まっている電荷には磁場から力が働かない',
        '力が速度に垂直なので、速さは変わらず向きだけが変わる',
      ],
      en: [
        'Fleming’s left-hand rule: middle finger = velocity of + charge, index = B, thumb = force',
        'A charge at rest feels no magnetic force',
        'Because the force is perpendicular to v, the speed stays the same and only the direction changes',
      ],
    },
    prediction: {
      prompt: {
        ja: '陽子が +x 向きに進んでいます。磁場は +z 向き（画面の上向きの矢印）。陽子は最初にどちらへ曲がるでしょう？',
        en: 'A proton moves in +x. The magnetic field points in +z. Which way does the proton bend first?',
      },
      options: [
        { id: 'py', label: { ja: '+y 方向', en: '+y' } },
        { id: 'ny', label: { ja: '-y 方向', en: '-y' } },
        { id: 'pz', label: { ja: '+z 方向（磁場の向き）', en: '+z (along B)' } },
        { id: 'none', label: { ja: '曲がらない', en: 'It does not bend' } },
      ],
      correctId: 'ny',
      explanation: {
        ja: 'v × B = (+x) × (+z) = -y。陽子は正電荷なので力も -y 向き。磁場の向きに力が働くわけではない点に注意！',
        en: 'v × B = (+x) × (+z) = -y. The proton is positive, so the force is also -y. Note that the force is NOT along the field!',
      },
    },
    observe: {
      ja: '赤い矢印（力）が、青い矢印（速度）に対していつも直角になっていることを確かめましょう。',
      en: 'Check that the red arrow (force) always stays at a right angle to the blue arrow (velocity).',
    },
    tryNext: {
      ja: '電荷 q をマイナスにすると、曲がる向きはどうなる？',
      en: 'What happens to the bending direction when you make the charge q negative?',
    },
    setup: {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 2 },
      particles: [
        { templateId: 'proton', mass: 2, position: { x: -1, y: 1.5, z: 0 }, velocity: { x: 2, y: 0, z: 0 } },
      ],
    },
  },
  {
    id: 'circular-motion',
    icon: '⭕',
    title: {
      ja: '等速円運動と半径・周期',
      en: 'Circular motion: radius and period',
    },
    idea: {
      ja: 'ローレンツ力が向心力になり、粒子は円を描きます。qvB = mv²/r から半径 r = mv/(qB)、周期 T = 2πm/(qB) が求まります。',
      en: 'The Lorentz force acts as the centripetal force, so the particle circles. From qvB = mv²/r we get r = mv/(qB) and T = 2πm/(qB).',
    },
    formula: 'r = mv / (qB)    T = 2πm / (qB)',
    points: {
      ja: [
        '速いほど、重いほど半径は大きい',
        '磁場が強いほど、電荷が大きいほど半径は小さい',
        '周期 T は速さによらない（サイクロトロンの原理）',
      ],
      en: [
        'Faster or heavier particles make bigger circles',
        'A stronger field or larger charge makes smaller circles',
        'The period T does not depend on speed (the cyclotron principle)',
      ],
    },
    prediction: {
      prompt: {
        ja: '同じ粒子を速さ 1 と速さ 2 で打ち出します。速さ 2 の円の半径は、速さ 1 の何倍？',
        en: 'The same kind of particle is launched at speed 1 and speed 2. How many times bigger is the radius at speed 2?',
      },
      options: [
        { id: 'half', label: { ja: '1/2 倍', en: '1/2×' } },
        { id: 'same', label: { ja: '同じ', en: 'The same' } },
        { id: 'double', label: { ja: '2 倍', en: '2×' } },
        { id: 'quad', label: { ja: '4 倍', en: '4×' } },
      ],
      correctId: 'double',
      explanation: {
        ja: 'r = mv/(qB) なので半径は速さに比例して 2 倍。しかも周期は同じなので、2 つの粒子は同時にスタート地点へ戻ってきます！',
        en: 'Since r = mv/(qB), the radius doubles with speed. And because the period is the same, both particles return to the start at the same moment!',
      },
    },
    observe: {
      ja: '大小 2 つの円を描く粒子が、同じタイミングでスタート地点に戻ってくるのを見届けましょう。',
      en: 'Watch the two particles on the small and large circles arrive back at the start together.',
    },
    tryNext: {
      ja: '磁場 B を 2 倍にすると、半径と周期はどう変わる？',
      en: 'Double B. How do the radius and period change?',
    },
    setup: {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 2 },
      particles: [
        { templateId: 'proton', mass: 2, position: { x: 0, y: 1.5, z: 0 }, velocity: { x: 1, y: 0, z: 0 } },
        { templateId: 'proton', mass: 2, position: { x: 0, y: 1.5, z: 0 }, velocity: { x: 2, y: 0, z: 0 } },
      ],
    },
  },
  {
    id: 'helix',
    icon: '🌀',
    title: {
      ja: 'らせん運動',
      en: 'Helical motion',
    },
    idea: {
      ja: '速度を「磁場に垂直な成分」と「平行な成分」に分けて考えます。垂直成分は円運動、平行成分は力を受けずにそのまま進むので、合わせるとらせんになります。',
      en: 'Split the velocity into parts perpendicular and parallel to B. The perpendicular part circles, the parallel part feels no force and just keeps going, so together they form a helix.',
    },
    formula: 'pitch = v∥ × T',
    points: {
      ja: [
        'v∥（磁場方向の速さ）は変わらない',
        'v⊥ が円の半径を、v∥ がらせんの間隔（ピッチ）を決める',
        'オーロラは、地球磁場に沿ってらせん運動する荷電粒子が作り出す',
      ],
      en: [
        'v∥ (speed along B) does not change',
        'v⊥ sets the radius, v∥ sets the spacing (pitch) of the helix',
        'Auroras are made by charged particles spiralling along Earth’s magnetic field',
      ],
    },
    prediction: {
      prompt: {
        ja: '磁場は +z 向き。粒子の速度の z 成分（磁場に平行な成分）は、時間とともにどうなる？',
        en: 'B points in +z. What happens to the z-component of the velocity (the part parallel to B) over time?',
      },
      options: [
        { id: 'same', label: { ja: '変わらない', en: 'It stays the same' } },
        { id: 'up', label: { ja: 'だんだん増える', en: 'It grows' } },
        { id: 'down', label: { ja: 'だんだん減る', en: 'It shrinks' } },
      ],
      correctId: 'same',
      explanation: {
        ja: 'v × B は B に垂直なので、B 方向の力は 0。z 方向は等速直線運動になり、一定の間隔でらせんを描きます。',
        en: 'v × B is perpendicular to B, so there is no force along B. Motion along z is uniform, giving a helix with constant spacing.',
      },
    },
    observe: {
      ja: 'らせんの間隔（ピッチ）が一定のまま、上へ上へと進んでいく様子を観察しましょう。',
      en: 'Watch the helix climb upward with a constant pitch.',
    },
    tryNext: {
      ja: '初速度の z 成分を大きくすると、らせんの間隔はどうなる？',
      en: 'Increase the z-component of the initial velocity. What happens to the pitch?',
    },
    setup: {
      electric: { x: 0, y: 0, z: 0 },
      magnetic: { x: 0, y: 0, z: 2 },
      particles: [
        { templateId: 'proton', mass: 2, position: { x: 0, y: 0, z: -3.5 }, velocity: { x: 2, y: 0, z: 0.6 } },
      ],
    },
  },
  {
    id: 'velocity-selector',
    icon: '🎯',
    title: {
      ja: '速度選別器',
      en: 'Velocity selector',
    },
    idea: {
      ja: '電場と磁場を直交させると、電気力 qE と磁気力 qvB が逆向きになります。2 つがつり合う速さ v = E/B の粒子だけが、まっすぐ通り抜けます。',
      en: 'With crossed E and B, the electric force qE and the magnetic force qvB point opposite ways. Only particles with v = E/B, where they balance, pass straight through.',
    },
    formula: 'qE = qvB  →  v = E / B',
    points: {
      ja: [
        '遅い粒子は電気力が勝って電場の向きへ曲がる',
        '速い粒子は磁気力が勝って逆向きへ曲がる',
        '質量分析器などで、特定の速さの粒子を取り出すのに使われる',
      ],
      en: [
        'Slow particles: electric force wins, they bend along E',
        'Fast particles: magnetic force wins, they bend the other way',
        'Used in mass spectrometers to pick out particles of one speed',
      ],
    },
    prediction: {
      prompt: {
        ja: 'E = 2、B = 1 の速度選別器に、速さ 1.5・2.0・2.5 の 3 つの陽子を打ち込みます。まっすぐ進むのはどれ？',
        en: 'Three protons with speeds 1.5, 2.0 and 2.5 enter a selector with E = 2 and B = 1. Which one goes straight?',
      },
      options: [
        { id: 'slow', label: { ja: '速さ 1.5', en: 'Speed 1.5' } },
        { id: 'mid', label: { ja: '速さ 2.0', en: 'Speed 2.0' } },
        { id: 'fast', label: { ja: '速さ 2.5', en: 'Speed 2.5' } },
        { id: 'all', label: { ja: '3 つとも', en: 'All three' } },
      ],
      correctId: 'mid',
      explanation: {
        ja: 'v = E/B = 2/1 = 2.0。速さ 1.5 は電場の向き（+y）へ、2.5 は逆（-y）へ曲がっていきます。',
        en: 'v = E/B = 2/1 = 2.0. The 1.5 particle bends toward +y (along E) and the 2.5 particle bends toward -y.',
      },
    },
    observe: {
      ja: '3 本の軌跡のうち、真ん中の 1 本だけが一直線になることを確かめましょう。',
      en: 'Check that only the middle trajectory of the three stays perfectly straight.',
    },
    tryNext: {
      ja: '電場 E を 3 にすると、どの速さの粒子が直進するようになる？',
      en: 'Set E to 3. Which speed now goes straight?',
    },
    setup: {
      electric: { x: 0, y: 2, z: 0 },
      magnetic: { x: 0, y: 0, z: 1 },
      particles: [
        { templateId: 'proton', mass: 4, position: { x: -4, y: 0, z: -1.2 }, velocity: { x: 1.5, y: 0, z: 0 } },
        { templateId: 'proton', mass: 4, position: { x: -4, y: 0, z: 0 }, velocity: { x: 2, y: 0, z: 0 } },
        { templateId: 'proton', mass: 4, position: { x: -4, y: 0, z: 1.2 }, velocity: { x: 2.5, y: 0, z: 0 } },
      ],
    },
  },
  {
    id: 'exb-drift',
    icon: '🌊',
    title: {
      ja: 'E × B ドリフト',
      en: 'E × B drift',
    },
    idea: {
      ja: '直交する電場と磁場の中では、粒子はくるくる回りながら E × B の向きへ流されていきます（サイクロイド運動）。この流れの速さは v = E/B です。',
      en: 'In crossed E and B fields, particles loop around while drifting in the E × B direction (cycloid motion). The drift speed is v = E/B.',
    },
    formula: 'v_d = E × B / B²',
    points: {
      ja: [
        'ドリフトの向きは電荷の符号や質量によらない',
        '回る向きや輪の大きさは電荷・質量で変わる',
        'プラズマ物理や核融合装置で重要な考え方',
      ],
      en: [
        'The drift direction does not depend on charge sign or mass',
        'The looping direction and size do depend on charge and mass',
        'A key idea in plasma physics and fusion devices',
      ],
    },
    prediction: {
      prompt: {
        ja: '静止した電子と陽子を、直交する電場と磁場の中に置きます。2 つはどちらへ流れていく？',
        en: 'An electron and a proton start at rest in crossed E and B fields. Where do they drift?',
      },
      options: [
        { id: 'same', label: { ja: '同じ向きへ流れる', en: 'The same direction' } },
        { id: 'opposite', label: { ja: '逆向きへ流れる', en: 'Opposite directions' } },
        { id: 'stay', label: { ja: 'その場で回るだけ', en: 'They just circle in place' } },
      ],
      correctId: 'same',
      explanation: {
        ja: 'v_d = E × B / B² には電荷 q が入っていません。電子と陽子は逆回りの輪を描きながら、同じ +x 向きへ流れていきます。',
        en: 'v_d = E × B / B² contains no charge q. The electron and proton loop in opposite senses but drift together in +x.',
      },
    },
    observe: {
      ja: '電子と陽子のループの向きは逆なのに、全体としては同じ向きに流れていくことに注目！',
      en: 'Notice that the loops turn in opposite senses, yet both particles drift the same way!',
    },
    tryNext: {
      ja: '磁場 B の向きを反転させると、ドリフトの向きはどうなる？',
      en: 'Flip the direction of B. What happens to the drift?',
    },
    setup: {
      electric: { x: 0, y: 1.5, z: 0 },
      magnetic: { x: 0, y: 0, z: 1.5 },
      particles: [
        { templateId: 'electron', position: { x: -3.5, y: 2.5, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
        { templateId: 'proton', mass: 2, position: { x: -3.5, y: -2, z: 0 }, velocity: { x: 0, y: 0, z: 0 } },
      ],
    },
  },
];
