import type { FieldPresetId, Language, ScaleMode, StudyTab, Theme } from '../lib/types';

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
  study: {
    tabs: Record<StudyTab, string>;
    lessonStep: string;
    keyIdea: string;
    points: string;
    predict: string;
    predictHint: string;
    prepare: string;
    prepared: string;
    observe: string;
    tryNext: string;
    prev: string;
    next: string;
    lessonDone: string;
    missionsIntro: string;
    start: string;
    retry: string;
    active: string;
    cleared: string;
    goal: string;
    hint: string;
    showHint: string;
    difficulty: string;
    progress: string;
    quit: string;
    clearedToast: string;
    lessonToast: string;
    quizScore: string;
  };
  hero: {
    steps: [string, string, string];
    lessons: string;
    missions: string;
    shortcuts: string;
  };
  legend: {
    electric: string;
    magnetic: string;
    velocity: string;
    force: string;
    radius: string;
    target: string;
  };
}

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
    study: {
      tabs: {
        lessons: 'レッスン',
        missions: 'ミッション',
        explain: '解説',
        quiz: 'クイズ',
      },
      lessonStep: 'STEP',
      keyIdea: 'ポイント',
      points: 'おさえておこう',
      predict: '予想してみよう',
      predictHint: '答えを選ぶと実験がスタートします',
      prepare: 'この実験を準備する',
      prepared: '準備 OK！ 予想を選ぶと再生されます',
      observe: '観察ポイント',
      tryNext: 'もっと試そう',
      prev: '前へ',
      next: '次へ',
      lessonDone: '完了',
      missionsIntro: '学んだことを使ってミッションに挑戦！ 操作パネルで値を変えて、条件をクリアしよう。',
      start: '挑戦する',
      retry: 'もう一度',
      active: '挑戦中',
      cleared: 'クリア',
      goal: 'クリア条件',
      hint: 'ヒント',
      showHint: 'ヒントを見る',
      difficulty: '難易度',
      progress: '達成度',
      quit: '中断する',
      clearedToast: 'ミッションクリア！',
      lessonToast: '正解！ 予想どおり！',
      quizScore: '正解数',
    },
    hero: {
      steps: ['レッスンで学ぶ', '3D で観察する', 'ミッションに挑戦'],
      lessons: 'レッスン',
      missions: 'ミッション',
      shortcuts: 'Space: 再生/停止　R: リセット',
    },
    legend: {
      electric: '電場 E',
      magnetic: '磁場 B',
      velocity: '速度 v',
      force: '力 F',
      radius: '円運動の半径',
      target: 'ゴール',
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
    study: {
      tabs: {
        lessons: 'Lessons',
        missions: 'Missions',
        explain: 'Explain',
        quiz: 'Quiz',
      },
      lessonStep: 'STEP',
      keyIdea: 'Key idea',
      points: 'Remember',
      predict: 'Make a prediction',
      predictHint: 'Pick an answer to start the experiment',
      prepare: 'Set up this experiment',
      prepared: 'Ready! Pick a prediction to play',
      observe: 'What to watch',
      tryNext: 'Try more',
      prev: 'Back',
      next: 'Next',
      lessonDone: 'Done',
      missionsIntro: 'Put what you learned to work! Change values in the control panel to meet each goal.',
      start: 'Start',
      retry: 'Retry',
      active: 'In progress',
      cleared: 'Cleared',
      goal: 'Goal',
      hint: 'Hint',
      showHint: 'Show hint',
      difficulty: 'Difficulty',
      progress: 'Progress',
      quit: 'Quit',
      clearedToast: 'Mission cleared!',
      lessonToast: 'Correct! Nice prediction!',
      quizScore: 'Score',
    },
    hero: {
      steps: ['Learn with lessons', 'Observe in 3D', 'Take on missions'],
      lessons: 'Lessons',
      missions: 'Missions',
      shortcuts: 'Space: play/pause   R: reset',
    },
    legend: {
      electric: 'Electric field E',
      magnetic: 'Magnetic field B',
      velocity: 'Velocity v',
      force: 'Force F',
      radius: 'Orbit radius',
      target: 'Goal',
    },
  },
};
