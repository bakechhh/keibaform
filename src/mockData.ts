import { Race, Horse } from './types';

// Supabase未接続時のモックデータ（デモ用）
const createMockHorse = (
  number: number,
  name: string,
  winRate: number,
  placeRate: number,
  showRate: number,
  finalScore: number,
  popularity: number,
  tanshoOdds: number
): Horse => {
  const powerScore = (winRate * 100) + (placeRate * 100) + (showRate * 100) + finalScore;

  // 効率ランク計算
  const returnRate = Math.round(tanshoOdds * 100);
  let efficiency: Horse['efficiency'];
  if (returnRate >= 2000) {
    efficiency = { rank: 'SS', label: '🔥超効率', returnRate, color: '#dc2626' };
  } else if (returnRate >= 1000) {
    efficiency = { rank: 'S', label: '🔥高効率', returnRate, color: '#ea580c' };
  } else if (returnRate >= 400) {
    efficiency = { rank: 'A', label: '✅効率的', returnRate, color: '#16a34a' };
  } else if (returnRate >= 250) {
    efficiency = { rank: 'B', label: '⚠️標準', returnRate, color: '#ca8a04' };
  } else {
    efficiency = { rank: 'C', label: '❌非効率', returnRate, color: '#6b7280' };
  }

  const COLORS = [
    '#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#2ecc71',
    '#1abc9c', '#e67e22', '#8e44ad', '#16a085', '#c0392b',
  ];

  // バッジ作成
  const badges: Horse['analysis']['badges'] = [];
  if (number === 1) {
    badges.push({ text: '👑鉄板軸', type: 'axis', style: 'main', val: finalScore.toFixed(0) });
  } else if (number <= 3) {
    badges.push({ text: '📌注目', type: 'value', style: 'main', val: '' });
  }
  if (winRate > 0.5) {
    badges.push({ text: 'AI高評価', type: 'win', style: 'rank', val: '1位' });
  }

  return {
    id: `mock-${number}`,
    name,
    number,
    jockey: '騎手未定',
    popularity,
    color: COLORS[(number - 1) % COLORS.length],
    predictions: {
      win_rate: winRate,
      place_rate: placeRate,
      show_rate: showRate,
      win_rate_rank: number,
      place_rate_rank: number,
      show_rate_rank: number,
    },
    indices: {
      final_score: finalScore,
      mining_index: finalScore - 5,
      corrected_time_deviation: Math.random() * 2 - 1,
      zi_deviation: Math.random() * 2,
      base_score: finalScore - 10,
    },
    miningRank: number,
    raceEvalRank: number,
    ziRank: number,
    baseRank: number,
    finalRank: number,
    stats: {
      speed: Math.round(winRate * 100),
      stamina: Math.round(placeRate * 100),
      power: Math.round(finalScore),
      guts: Math.round(finalScore - 5),
      intelligence: Math.round(finalScore - 10),
      technique: Math.round(50 + Math.random() * 30),
    },
    tanshoOdds,
    fukushoOdds: { min: tanshoOdds * 0.3, max: tanshoOdds * 0.5 },
    powerScore,
    powerRank: number,
    efficiency,
    analysis: {
      status: number === 1 ? 'axis_iron' : number <= 3 ? 'value' : 'safe',
      isBuy: number <= 4,
      badges,
    },
    overallRating: Math.round(90 - (number - 1) * 5),
    winRate: Math.round(winRate * 100),
    placeRate: Math.round(placeRate * 100),
    pastRaces: [
      {
        date: '2024.12.1',
        raceName: 'サンプルレース',
        position: number.toString(),
        place: '東京',
        distance: 1600,
        surface: '芝',
        condition: '良',
        runningStyle: '先',
        last3f: 35.5,
        ave3f: 36.0,
        margin: 0.3,
        correctedTime: 98,
        pci: 45.0,
        frame: number,
        horseNumber: number,
        weight: 57,
        weightReduction: '',
        position3f: 0.2,
      },
    ],
  };
};

export const mockRaces: Race[] = [
  {
    id: 'mock-tokyo-1r',
    originalRaceId: 'mock-tokyo-1r',
    name: 'サンプル新馬戦',
    date: new Date().toISOString().split('T')[0],
    location: '東京',
    round: 1,
    distance: 1600,
    surface: '芝',
    condition: '良',
    grade: '新馬',
    horses: [
      createMockHorse(1, 'サンプルホース', 0.65, 0.80, 0.88, 72, 1, 2.5),
      createMockHorse(2, 'テストランナー', 0.55, 0.72, 0.82, 68, 2, 4.2),
      createMockHorse(3, 'モックスター', 0.48, 0.65, 0.75, 64, 3, 6.8),
      createMockHorse(4, 'デモウマ', 0.42, 0.58, 0.68, 60, 4, 12.5),
      createMockHorse(5, 'フェイクホース', 0.35, 0.50, 0.62, 56, 5, 18.0),
      createMockHorse(6, 'ダミーラン', 0.28, 0.42, 0.55, 52, 6, 25.0),
    ],
    evaluation: {
      type: 'GOOD',
      label: '🎯 チャンス',
      color: '#ea580c',
      bg: '#fff7ed',
      description: '軸馬が明確でチャンスあり',
    },
  },
  {
    id: 'mock-tokyo-2r',
    originalRaceId: 'mock-tokyo-2r',
    name: 'サンプル未勝利',
    date: new Date().toISOString().split('T')[0],
    location: '東京',
    round: 2,
    distance: 1800,
    surface: 'ダ',
    condition: '良',
    grade: '未勝利',
    horses: [
      createMockHorse(1, 'ダートキング', 0.58, 0.75, 0.85, 70, 2, 3.8),
      createMockHorse(2, 'サンドストーム', 0.62, 0.78, 0.86, 71, 1, 2.2),
      createMockHorse(3, 'マッドランナー', 0.45, 0.62, 0.72, 62, 3, 8.5),
      createMockHorse(4, 'グラウンドヒーロー', 0.38, 0.55, 0.65, 58, 4, 15.0),
      createMockHorse(5, 'ダストデビル', 0.30, 0.45, 0.58, 54, 5, 22.0),
    ],
    evaluation: {
      type: 'SOLID',
      label: '✅ 堅実',
      color: '#15803d',
      bg: '#f0fdf4',
      description: '軸は安定だが妙味は少なめ',
    },
  },
];
