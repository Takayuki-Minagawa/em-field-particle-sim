import type { FieldPresetId, Language, ScaleMode, Theme } from '../lib/types';

type Copy = {
  title: string;
  subtitle: string;
  normalizedNote: string;
  panels: {
    controls: string;
    simulation: string;
    stats: string;
    learning: string;
  };
  toggles: {
    language: string;
    theme: string;
    themeValue: Record<Theme, string>;
  };
  controls: {
    fieldPreset: string;
    particles: string;
    addElectron: string;
    addProton: string;
    addAlpha: string;
    addCustom: string;
    removeParticle: string;
    mass: string;
    charge: string;
    initialPosition: string;
    initialVelocity: string;
    electricField: string;
    magneticField: string;
    density: string;
    scaleMode: string;
    scaleModeValue: Record<ScaleMode, string>;
    playback: string;
    play: string;
    pause: string;
    reset: string;
    speed: string;
    trail: string;
    cameraFollow: string;
    resetView: string;
  };
  metrics: {
    time: string;
    speed: string;
    kineticEnergy: string;
    force: string;
    acceleration: string;
    radius: string;
    period: string;
    position: string;
    history: string;
    noRadius: string;
  };
  learning: {
    explanation: string;
    quiz: string;
    answer: string;
    correct: string;
    wrong: string;
  };
  presetLabels: Record<FieldPresetId, string>;
};

export const copy: Record<Language, Copy> = {
  ja: {
    title: '電場・磁場と荷電粒子の運動シミュレーター',
    subtitle:
      '一様電場・磁場中のローレンツ力、円運動、らせん運動、速度選別器を 3D で比較観察する教材アプリ',
    normalizedNote: '値は教材向けの正規化単位です。厳密な実測値ではなく、軌跡の理解を優先しています。',
    panels: {
      controls: '操作パネル',
      simulation: '3D シミュレーション',
      stats: '数値・グラフ',
      learning: '学習パネル',
    },
    toggles: {
      language: '言語',
      theme: 'テーマ',
      themeValue: {
        light: 'ライト',
        dark: 'ダーク',
      },
    },
    controls: {
      fieldPreset: '場のプリセット',
      particles: '粒子設定',
      addElectron: '電子を追加',
      addProton: '陽子を追加',
      addAlpha: 'アルファ粒子を追加',
      addCustom: '比較粒子を追加',
      removeParticle: '選択粒子を削除',
      mass: '質量 m',
      charge: '電荷 q',
      initialPosition: '初期位置',
      initialVelocity: '初速度',
      electricField: '電場 E',
      magneticField: '磁場 B',
      density: '矢印密度',
      scaleMode: '表示スケール',
      scaleModeValue: {
        teaching: '教材強調',
        balanced: 'バランス',
      },
      playback: '再生制御',
      play: '再生',
      pause: '一時停止',
      reset: 'リセット',
      speed: '倍速',
      trail: '軌跡の長さ',
      cameraFollow: 'カメラ追尾',
      resetView: '視点をリセット',
    },
    metrics: {
      time: '経過時間',
      speed: '速度',
      kineticEnergy: '運動エネルギー',
      force: 'ローレンツ力',
      acceleration: '加速度',
      radius: 'サイクロトロン半径',
      period: 'サイクロトロン周期',
      position: '位置の大きさ',
      history: '時系列',
      noRadius: '磁場または電荷が 0 のため定義なし',
    },
    learning: {
      explanation: '状態解説',
      quiz: 'クイズ',
      answer: '解答',
      correct: '正解',
      wrong: '再確認',
    },
    presetLabels: {
      electric: '電場のみ',
      magnetic: '磁場のみ',
      parallel: '平行場',
      orthogonal: '垂直場',
      selector: '速度選別器',
      custom: 'カスタム',
    },
  },
  en: {
    title: 'Electric and Magnetic Field Particle Simulator',
    subtitle:
      'An interactive 3D lesson for Lorentz force, circular motion, helices, and velocity selection in uniform fields',
    normalizedNote:
      'Values use normalized teaching units. The goal is conceptual understanding rather than exact laboratory scaling.',
    panels: {
      controls: 'Controls',
      simulation: '3D Simulation',
      stats: 'Metrics and Graphs',
      learning: 'Learning Panel',
    },
    toggles: {
      language: 'Language',
      theme: 'Theme',
      themeValue: {
        light: 'Light',
        dark: 'Dark',
      },
    },
    controls: {
      fieldPreset: 'Field presets',
      particles: 'Particle setup',
      addElectron: 'Add electron',
      addProton: 'Add proton',
      addAlpha: 'Add alpha particle',
      addCustom: 'Add comparison particle',
      removeParticle: 'Remove selected particle',
      mass: 'Mass m',
      charge: 'Charge q',
      initialPosition: 'Initial position',
      initialVelocity: 'Initial velocity',
      electricField: 'Electric field E',
      magneticField: 'Magnetic field B',
      density: 'Arrow density',
      scaleMode: 'Display scale',
      scaleModeValue: {
        teaching: 'Teaching focus',
        balanced: 'Balanced',
      },
      playback: 'Playback',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset',
      speed: 'Speed',
      trail: 'Trail length',
      cameraFollow: 'Camera follow',
      resetView: 'Reset view',
    },
    metrics: {
      time: 'Elapsed time',
      speed: 'Speed',
      kineticEnergy: 'Kinetic energy',
      force: 'Lorentz force',
      acceleration: 'Acceleration',
      radius: 'Cyclotron radius',
      period: 'Cyclotron period',
      position: 'Position magnitude',
      history: 'Time history',
      noRadius: 'Undefined because charge or magnetic field is zero',
    },
    learning: {
      explanation: 'Generated explanation',
      quiz: 'Quiz',
      answer: 'Answer',
      correct: 'Correct',
      wrong: 'Check again',
    },
    presetLabels: {
      electric: 'Electric only',
      magnetic: 'Magnetic only',
      parallel: 'Parallel fields',
      orthogonal: 'Orthogonal fields',
      selector: 'Velocity selector',
      custom: 'Custom',
    },
  },
};
