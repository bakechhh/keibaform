/**
 * 競馬脳ロジック Ver 4.1 (TypeScript完全移植版)
 * コンセプト:
 *   PowerScoreによる絶対序列
 *   ＋ 人気と実力のGAPで妙味検出
 *   ＋ 下位馬の厳格フィルタリング
 *   ＋ 準軸（妙味軸）を明示的に扱う
 *   ＋ 勝負/チャンス判定を競馬脳寄りに再設計
 */

import { RawHorse, HorseStats, EfficiencyRank } from '../types';

// ===== 設定値 =====
export const CONFIG = {
  MIN_FINAL_SCORE: 45.0,  // 紐（Safe）判定用の基準
  SAFE_AI_SCORE: 0.45,    // 紐（Safe）判定用のAI基準（単勝AI）
  EFFICIENCY_LINE: 400,   // 効率ライン（回収率%）= 単勝4倍相当
};

// ===== バッジ型 =====
export interface Badge {
  text: string;
  type: string;
  style: 'main' | 'gap' | 'rank';
  val: string;
}

// ===== 分析結果型 =====
export interface HorseAnalysis {
  status: 'axis_iron' | 'axis_strong' | 'axis_value' | 'value_high' | 'value' | 'ability' | 'safe' | 'delete';
  isBuy: boolean;
  badges: Badge[];
}

// ===== レース評価型 =====
export interface RaceEvaluation {
  type: 'SUPER' | 'GOOD' | 'SOLID' | 'CHAOS' | 'NORMAL' | 'KEN';
  label: string;
  color: string;
  bg: string;
  description: string;
}

// ===== 拡張された馬データ型（ランク付き）=====
export interface HorseWithRanks extends RawHorse {
  miningRank?: number;
  raceEvalRank?: number;
  ziRank?: number;
  baseRank?: number;
  finalRank?: number;
  powerScore?: number;
  powerRank?: number;
  tanshoOdds?: number;
  efficiency?: EfficiencyRank;
  analysis?: HorseAnalysis;
}

// 馬の色
const HORSE_COLORS = [
  '#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#2ecc71',
  '#1abc9c', '#e67e22', '#8e44ad', '#16a085', '#c0392b',
  '#2980b9', '#27ae60', '#d35400', '#7f8c8d', '#34495e',
  '#f1c40f', '#e91e63', '#00bcd4',
];

export function getHorseColor(horseNumber: number): string {
  return HORSE_COLORS[(horseNumber - 1) % HORSE_COLORS.length];
}

/**
 * 単勝オッズから資金効率ランクを計算（10段階）
 */
export function calculateEfficiency(odds: number): EfficiencyRank {
  if (!odds || odds <= 1) {
    return {
      returnRate: 0,
      rank: '-',
      label: '-',
      color: '#94a3b8',
    };
  }

  const returnRate = Math.round(odds * 100);

  if (returnRate >= 2000) {
    return { returnRate, rank: 'SS', label: '超効率', color: '#dc2626' };
  }
  if (returnRate >= 1000) {
    return { returnRate, rank: 'S', label: '高効率', color: '#ea580c' };
  }
  if (returnRate >= 600) {
    return { returnRate, rank: 'A+', label: '効率優', color: '#d97706' };
  }
  if (returnRate >= 400) {
    return { returnRate, rank: 'A', label: '効率的', color: '#16a34a' };
  }
  if (returnRate >= 300) {
    return { returnRate, rank: 'B+', label: '準効率', color: '#65a30d' };
  }
  if (returnRate >= 250) {
    return { returnRate, rank: 'B', label: '標準', color: '#ca8a04' };
  }
  if (returnRate >= 200) {
    return { returnRate, rank: 'C+', label: '準標準', color: '#a16207' };
  }
  if (returnRate >= 150) {
    return { returnRate, rank: 'C', label: '非効率', color: '#6b7280' };
  }
  return { returnRate, rank: 'D', label: '低効率', color: '#94a3b8' };
}

/**
 * 各指標をランク化
 */
export function calculateDynamicRanks(horses: HorseWithRanks[]): void {
  const assignRank = (keyPath: string, rankKey: keyof HorseWithRanks) => {
    const getValue = (h: HorseWithRanks): number => {
      const keys = keyPath.split('.');
      let val: unknown = h;
      for (const k of keys) {
        val = val ? (val as Record<string, unknown>)[k] : null;
      }
      return val !== null && val !== undefined ? parseFloat(String(val)) : -9999;
    };

    const sorted = [...horses].sort((a, b) => getValue(b) - getValue(a));
    sorted.forEach((h, i) => {
      const targetH = horses.find(org => org.horse_number === h.horse_number);
      if (targetH) {
        (targetH as unknown as Record<string, unknown>)[rankKey] = i + 1;
      }
    });
  };

  assignRank('indices.mining_index', 'miningRank');
  assignRank('indices.corrected_time_deviation', 'raceEvalRank');
  assignRank('indices.zi_deviation', 'ziRank');
  assignRank('indices.base_score', 'baseRank');
  assignRank('indices.final_score', 'finalRank');
}

/**
 * PowerScore計算（AI3つ＋最終スコアの単純和）
 */
export function calculatePowerScores(horses: HorseWithRanks[]): void {
  horses.forEach(h => {
    const aiWin = h.predictions?.win_rate ?? 0;
    const aiPlace = h.predictions?.place_rate ?? 0;
    const aiShow = h.predictions?.show_rate ?? 0;
    const finalSc = h.indices?.final_score ?? 0;

    h.powerScore = (aiWin * 100) + (aiPlace * 100) + (aiShow * 100) + finalSc;
  });

  const sorted = [...horses].sort((a, b) => (b.powerScore ?? 0) - (a.powerScore ?? 0));
  sorted.forEach((h, i) => {
    const targetH = horses.find(org => org.horse_number === h.horse_number);
    if (targetH) targetH.powerRank = i + 1;
  });
}

/**
 * 個別馬評価
 */
export function evaluateHorse(horse: HorseWithRanks): HorseAnalysis {
  const result: HorseAnalysis = { status: 'delete', isBuy: false, badges: [] };

  if (!horse.popularity || !horse.indices || !horse.predictions) {
    return result;
  }

  const pop = horse.popularity;
  const powerRank = horse.powerRank ?? 99;
  const preds = horse.predictions;
  const idx = horse.indices;

  // 1. 全指標のGAPスキャン（妙味候補抽出）
  let gapCount = 0;
  let maxGap = 0;

  const checkMetric = (rank: number | undefined, name: string, type: string) => {
    if (!rank || rank > 99) return;
    const threshold = rank <= 5 ? 2 : 3;
    const gap = pop - rank;

    if (gap >= threshold) {
      result.badges.push({ text: name, type, style: 'gap', val: `G${gap}` });
      gapCount++;
      if (gap > maxGap) maxGap = gap;
    } else if (rank <= 3) {
      result.badges.push({ text: name, type, style: 'rank', val: `${rank}位` });
    }
  };

  checkMetric(preds.win_rate_rank, '単勝AI', 'win');
  checkMetric(preds.place_rate_rank, '連対AI', 'place');
  checkMetric(preds.show_rate_rank, '複勝AI', 'show');
  checkMetric(horse.finalRank, '最終Sc', 'final');
  checkMetric(horse.miningRank, 'Mining', 'mining');
  checkMetric(horse.raceEvalRank, 'R評価', 'ability');
  checkMetric(horse.ziRank, '前走ZI', 'zi');
  checkMetric(horse.baseRank, '基礎Sc', 'base');

  // 2. ステータス判定（PowerRankベース）

  // A. 総合1位（メイン軸 1頭固定）
  if (powerRank === 1) {
    if (gapCount > 0) {
      result.status = 'value_high';
      result.badges.unshift({ text: '🔥激熱軸', type: 'axis_rebel', style: 'main', val: `G${maxGap}` });
    } else if (preds.win_rate >= 0.78 || idx.final_score >= 65.0) {
      result.status = 'axis_iron';
      result.badges.unshift({ text: '👑鉄板軸', type: 'axis', style: 'main', val: idx.final_score.toFixed(0) });
    } else {
      result.status = 'axis_strong';
      result.badges.unshift({ text: '🎯有力軸', type: 'axis_weak', style: 'main', val: '' });
    }
  }
  // B. 総合2〜3位（相手候補 ＋ 準軸判定）
  else if (powerRank <= 3) {
    const popGap = pop - powerRank;
    const isStrongScore = (idx.final_score >= 60.0 || preds.win_rate >= 0.55 || preds.show_rate >= 0.60);

    if (gapCount > 0 && popGap >= 2 && isStrongScore) {
      result.status = 'axis_value';
      result.badges.unshift({ text: '💡妙味軸', type: 'axis_value', style: 'main', val: `G${popGap}` });
    } else if (gapCount > 0) {
      result.status = 'value';
    } else {
      result.status = 'ability';
    }
  }
  // C. 総合4位以下（紐・穴）★厳格フィルタ適用
  else {
    const finalSc = idx.final_score;
    let isQualified = false;

    if (powerRank <= 5 && gapCount >= 1) {
      isQualified = true;
    } else {
      if (finalSc < 40.0) {
        isQualified = false;
      } else if (finalSc < 50.0) {
        if (gapCount >= 3 || maxGap >= 5) {
          isQualified = true;
        }
      } else {
        if (gapCount >= 1) {
          isQualified = true;
        }
      }
    }

    if (isQualified) {
      result.status = 'value';
    } else {
      const isSafe =
        (finalSc >= CONFIG.MIN_FINAL_SCORE) ||
        (preds.win_rate >= CONFIG.SAFE_AI_SCORE);

      if (isSafe) {
        result.status = 'safe';
      }
    }
  }

  // 3. 最終仕上げ（バッジ整理・isBuy）
  if (result.status === 'delete') {
    result.badges = [];
    result.isBuy = false;
  } else {
    result.isBuy = true;
    const priority: Record<string, number> = { main: 4, gap: 3, rank: 1 };
    result.badges.sort((a, b) => (priority[b.style] || 0) - (priority[a.style] || 0));
  }

  return result;
}

/**
 * レース全体の判定
 */
export function evaluateRace(horses: HorseWithRanks[]): RaceEvaluation {
  const horsesWithAna = horses.filter(h => h.analysis);

  const getEfficiencyScore = (rank: string | undefined): number => {
    const scores: Record<string, number> = { 'SS': 8, 'S': 7, 'A+': 6, 'A': 5, 'B+': 4, 'B': 3, 'C+': 2, 'C': 1, 'D': 0, '-': 0 };
    return rank ? (scores[rank] || 0) : 0;
  };

  // 軸馬の抽出
  const axisStatuses = ['axis_iron', 'axis_strong', 'axis_value', 'value_high'];
  const axisHorses = horsesWithAna.filter(h => axisStatuses.includes(h.analysis!.status));

  let bestAxis: HorseWithRanks | null = null;
  let bestAxisEffScore = 0;
  axisHorses.forEach(h => {
    const effScore = getEfficiencyScore(h.efficiency?.rank);
    if (effScore > bestAxisEffScore) {
      bestAxisEffScore = effScore;
      bestAxis = h;
    }
  });

  const axisIsEfficient = bestAxisEffScore >= 5;  // A以上
  const axisIsStandard = bestAxisEffScore >= 3 && bestAxisEffScore <= 4;  // B〜B+
  const axisIsInefficient = bestAxisEffScore <= 2; // C+以下

  // 妙味馬の抽出
  const valueLikeStatuses = ['value', 'value_high', 'axis_value'];
  const valueHorses = horsesWithAna.filter(h => valueLikeStatuses.includes(h.analysis!.status));
  const valueCount = valueHorses.length;

  const hasHighEfficiencyValue = valueHorses.some(h =>
    getEfficiencyScore(h.efficiency?.rank) >= 7
  );

  // デフォルト
  let result: RaceEvaluation = {
    type: 'KEN',
    label: '👁️ 見',
    color: '#94a3b8',
    bg: '#f1f5f9',
    description: '妙味薄。無理に勝負する必要はありません。',
  };

  // 1. 🔥勝負レース: 軸が効率的(A)以上
  if (axisHorses.length > 0 && axisIsEfficient && bestAxis !== null) {
    const theAxis = bestAxis as HorseWithRanks;
    const axisType = theAxis.analysis?.status ?? 'axis_strong';
    const axisOdds = theAxis.tanshoOdds?.toFixed(1) ?? '?';
    const axisEff = theAxis.efficiency?.label ?? '';

    if (axisType === 'value_high' || axisType === 'axis_value') {
      result = {
        type: 'SUPER',
        label: '🔥 勝負',
        color: '#dc2626',
        bg: '#fef2f2',
        description: `妙味軸が${axisOdds}倍で${axisEff}！単勝狙い目のレースです。`,
      };
    } else {
      result = {
        type: 'SUPER',
        label: '🔥 勝負',
        color: '#dc2626',
        bg: '#fef2f2',
        description: `軸が${axisOdds}倍で${axisEff}！単勝から勝負できるレースです。`,
      };
    }
  }
  // 2. 🎯チャンス: 軸は標準(B)だが、高効率の妙味馬がいる
  else if (axisHorses.length > 0 && axisIsStandard && hasHighEfficiencyValue) {
    result = {
      type: 'GOOD',
      label: '🎯 チャンス',
      color: '#ea580c',
      bg: '#fff7ed',
      description: '軸の単勝は非効率だが、妙味馬に高効率あり。実力・妙味馬の単勝を狙え。',
    };
  }
  // 3. ✅堅実: 軸はいるが効率は標準以下
  else if (axisHorses.length > 0 && (axisIsStandard || axisIsInefficient)) {
    const theAxis = bestAxis as HorseWithRanks | null;
    const axisOdds = theAxis?.tanshoOdds?.toFixed(1) ?? '?';
    result = {
      type: 'SOLID',
      label: '✅ 堅実',
      color: '#15803d',
      bg: '#f0fdf4',
      description: `軸${axisOdds}倍は単勝非効率。馬連・ワイド中心で点数を絞る。`,
    };
  }
  // 4. 💰波乱: 軸不在だが妙味馬多数
  else if (valueCount >= 3) {
    result = {
      type: 'CHAOS',
      label: '💰 波乱',
      color: '#7e22ce',
      bg: '#faf5ff',
      description: '軸不明で妙味馬多数。BOXや穴狙い向きのレースです。',
    };
  }
  // 5. 🤔混戦: 妙味が少しある
  else if (valueCount >= 1) {
    result = {
      type: 'NORMAL',
      label: '🤔 混戦',
      color: '#b45309',
      bg: '#fffbeb',
      description: '方向性は悪くないが決め手に欠ける混戦レースです。',
    };
  }

  return result;
}

/**
 * レース単位メイン入口
 */
export function analyzeRace(horses: HorseWithRanks[], oddsMap: Map<number, number>): {
  horses: HorseWithRanks[];
  evaluation: RaceEvaluation;
} {
  // 1. オッズと効率を設定
  horses.forEach(h => {
    h.tanshoOdds = oddsMap.get(h.horse_number) ?? 99.9;
    h.efficiency = calculateEfficiency(h.tanshoOdds);
  });

  // 2. 各指数のランク化
  calculateDynamicRanks(horses);

  // 3. 総合期待値（PowerScore）の計算
  calculatePowerScores(horses);

  // 4. 各馬の評価
  horses.forEach(h => {
    h.analysis = evaluateHorse(h);
  });

  // 5. レース判定
  const evaluation = evaluateRace(horses);

  return { horses, evaluation };
}

// ===== UI表示用のヘルパー =====

export function convertToStats(horse: RawHorse): HorseStats {
  const { predictions, indices } = horse;
  const normalizedTimeDeviation = Math.min(100, Math.max(0, (indices.corrected_time_deviation + 3) * (100 / 6)));

  return {
    speed: Math.round(predictions.win_rate * 100),
    stamina: Math.round(predictions.place_rate * 100),
    power: Math.round(indices.final_score),
    guts: Math.round(indices.mining_index),
    intelligence: Math.round(indices.base_score),
    technique: Math.round(normalizedTimeDeviation),
  };
}

export function calculateOverallRating(horse: RawHorse, powerRank: number, totalHorses: number): number {
  const { predictions, indices } = horse;
  const aiScore = (predictions.win_rate * 30) + (predictions.place_rate * 20) + (predictions.show_rate * 10);
  const indexScore = (indices.final_score / 80) * 25;
  const rankBonus = ((totalHorses - powerRank + 1) / totalHorses) * 15;
  return Math.round(Math.min(100, aiScore + indexScore + rankBonus));
}

// バッジをシンプルな文字列配列に変換（UI表示用）
export function badgesToStrings(badges: Badge[]): string[] {
  return badges.map(b => b.style === 'gap' ? `${b.text}(${b.val})` : b.text);
}

/**
 * 偏差値を計算
 * @param value 対象の値
 * @param values 全体の値の配列
 * @returns 偏差値（平均50、標準偏差10）
 */
export function calculateDeviationScore(value: number, values: number[]): number {
  if (values.length === 0) return 50;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 50;

  return 50 + ((value - mean) / stdDev) * 10;
}

/**
 * 順位から偏差値を計算（順位ベース）
 * @param rank 順位（1が最上位）
 * @param totalHorses 全頭数
 * @returns 偏差値
 */
export function calculateRankDeviationScore(rank: number, totalHorses: number): number {
  if (totalHorses <= 1) return 50;

  // 順位を0-1のスケールに変換（1位が1.0、最下位が0.0）
  const normalizedPosition = (totalHorses - rank) / (totalHorses - 1);

  // 偏差値に変換（1位が約70、最下位が約30になるよう調整）
  return 30 + normalizedPosition * 40;
}
