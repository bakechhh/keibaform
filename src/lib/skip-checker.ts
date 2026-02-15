/**
 * 見送りチェッカー - レースの「買い/見送り」判定
 *
 * 根本思想:
 * 「わからない」が前提。
 * このOSの最大の武器は「買わない判断」。
 * 見送ったレースが万馬券でも気にしない。
 */

import { HorseWithRanks } from './racing-logic';

// ===== チューニングパラメータ =====
export const SKIP_CONFIG = {
  // レース見送り条件
  showRateTopMin: 0.70,        // show_rate 1位がこれ未満 → 見送り
  showRateSpreadMin: 0.10,     // 上位5頭のshow_rate差がこれ未満 → 見送り（団子状態）
  minEliminatedCount: 4,       // 消し馬がこれ未満 → 見送り
  minHorses: 8,                // 出走頭数がこれ以下 → 見送り

  // 馬分類
  eliminateBottomRatio: 1 / 3, // 下位1/3を消し対象

  // オッズ効率帯（単勝オッズ）
  oddsEfficiencyA: 4.0,        // これ以上が「効率A」= 最も旨味ある投資先
  oddsEfficiencyTooLow: 1.5,   // 1番人気がこれ未満で妙味なし → 見送り候補
};

// ===== 見送り理由 =====
export interface SkipReason {
  code: string;
  label: string;
  detail: string;
  severity: '絶対見送り' | '警告';
}

// ===== 見送り判定結果 =====
export interface SkipCheckResult {
  shouldSkip: boolean;
  confidence: number;          // 0-100 見送り確信度
  reasons: SkipReason[];

  // レースグレード
  raceGrade: '最良' | '良い' | '普通' | '見送り';

  // 馬分類情報
  axisHorses: number[];        // 軸候補の馬番
  partnerHorses: number[];     // 相手候補の馬番
  eliminatedHorses: number[];  // 消し馬の馬番

  // サマリー（UI表示用）
  summary: string;

  // 詳細データ（UI表示用）
  details: {
    showRateTop: number | null;       // show_rate 1位のスコア
    showRateSpread: number | null;    // 上位5頭のshow_rate差
    eliminatedCount: number;          // 消し馬の数
    totalHorses: number;              // 出走頭数
    efficiencyACount: number;         // 効率A以上の馬の数
    favoriteOdds: number | null;      // 1番人気のオッズ
  };
}

/**
 * レースの見送り判定を実行
 */
export function checkSkip(horses: HorseWithRanks[]): SkipCheckResult {
  const reasons: SkipReason[] = [];
  const totalHorses = horses.length;

  // --- show_rate データ抽出 ---
  const showRates = horses
    .map(h => h.predictions?.show_rate ?? 0)
    .sort((a, b) => b - a); // 降順

  const showRateTop = showRates.length > 0 ? showRates[0] : null;
  const showRateSpread = showRates.length >= 5
    ? showRates[0] - showRates[4]
    : null;

  // --- 馬の分類（analysis.status ベース）---
  const axisStatuses = ['axis_iron', 'axis_strong', 'axis_value', 'value_high'];
  const partnerStatuses = ['value', 'ability'];

  const axisHorses = horses
    .filter(h => h.analysis && axisStatuses.includes(h.analysis.status))
    .map(h => h.horse_number);

  const partnerHorses = horses
    .filter(h => h.analysis && partnerStatuses.includes(h.analysis.status))
    .map(h => h.horse_number);

  const eliminatedHorses = horses
    .filter(h => h.analysis?.status === 'delete')
    .map(h => h.horse_number);

  const eliminatedCount = eliminatedHorses.length;

  // --- 効率A以上の馬 ---
  const efficiencyAHorses = horses.filter(h => {
    const odds = h.tanshoOdds ?? 99.9;
    return odds >= SKIP_CONFIG.oddsEfficiencyA;
  });
  const efficiencyACount = efficiencyAHorses.length;

  // --- 1番人気のオッズ ---
  const validOdds = horses
    .filter(h => h.tanshoOdds && h.tanshoOdds > 0 && h.tanshoOdds < 999)
    .map(h => h.tanshoOdds!);
  const favoriteOdds = validOdds.length > 0 ? Math.min(...validOdds) : null;

  // ===== 絶対見送り条件 =====

  // 1. モデルの分離力が低い（show_rate 1位が閾値未満）
  if (showRateTop !== null && showRateTop < SKIP_CONFIG.showRateTopMin) {
    reasons.push({
      code: '分離力不足',
      label: 'モデル分離力が低い',
      detail: `複勝AI 1位: ${(showRateTop * 100).toFixed(0)}%（閾値${(SKIP_CONFIG.showRateTopMin * 100).toFixed(0)}%未満）`,
      severity: '絶対見送り',
    });
  }

  // 2. 上位が団子状態
  if (showRateSpread !== null && showRateSpread < SKIP_CONFIG.showRateSpreadMin) {
    reasons.push({
      code: '団子状態',
      label: '上位が団子状態',
      detail: `1位と5位の差: ${(showRateSpread * 100).toFixed(1)}%（閾値${(SKIP_CONFIG.showRateSpreadMin * 100).toFixed(0)}%未満）`,
      severity: '絶対見送り',
    });
  }

  // 3. 消し馬が少ない
  if (eliminatedCount < SKIP_CONFIG.minEliminatedCount) {
    reasons.push({
      code: '消し不足',
      label: '消し馬が少ない',
      detail: `消し馬: ${eliminatedCount}頭（最低${SKIP_CONFIG.minEliminatedCount}頭必要）`,
      severity: '絶対見送り',
    });
  }

  // 4. 少頭数
  if (totalHorses <= SKIP_CONFIG.minHorses) {
    reasons.push({
      code: '少頭数',
      label: '頭数が少ない',
      detail: `出走頭数: ${totalHorses}頭（${SKIP_CONFIG.minHorses}頭以下）`,
      severity: '絶対見送り',
    });
  }

  // ===== 警告条件 =====

  // 5. 軸不在
  if (axisHorses.length === 0) {
    reasons.push({
      code: '軸不在',
      label: '軸馬がいない',
      detail: '鉄板軸・有力軸・妙味軸・激熱が0頭',
      severity: '警告',
    });
  }

  // 6. 妙味なし（効率A以上の馬が0頭）
  // 効率A以上かつ評価が高い馬（analysis.isBuy=true）で判定
  const valuableEffAHorses = efficiencyAHorses.filter(h => h.analysis?.isBuy);
  if (valuableEffAHorses.length === 0) {
    reasons.push({
      code: '妙味なし',
      label: 'オッズに妙味がない',
      detail: `効率A以上（${SKIP_CONFIG.oddsEfficiencyA}倍以上）で買い対象の馬が0頭`,
      severity: '警告',
    });
  }

  // 7. 堅すぎ（1番人気 < 1.5倍 かつ 2番人気以下に評価高い馬なし）
  if (favoriteOdds !== null && favoriteOdds < SKIP_CONFIG.oddsEfficiencyTooLow) {
    // 2番人気以下で軸級の馬がいるか
    const nonFavAxisHorses = horses.filter(h => {
      const odds = h.tanshoOdds ?? 99.9;
      const isFav = odds === favoriteOdds;
      return !isFav && h.analysis && axisStatuses.includes(h.analysis.status);
    });

    if (nonFavAxisHorses.length === 0) {
      reasons.push({
        code: '堅すぎ',
        label: '堅すぎて回収が合わない',
        detail: `1番人気 ${favoriteOdds.toFixed(1)}倍（${SKIP_CONFIG.oddsEfficiencyTooLow}倍未満）で他に軸候補なし`,
        severity: '警告',
      });
    }
  }

  // ===== 判定結果の集計 =====
  const absoluteSkipCount = reasons.filter(r => r.severity === '絶対見送り').length;
  const warningCount = reasons.filter(r => r.severity === '警告').length;

  const shouldSkip = absoluteSkipCount > 0;
  const confidence = Math.min(100, (absoluteSkipCount * 30) + (warningCount * 15));

  // レースグレード算出
  let raceGrade: SkipCheckResult['raceGrade'];
  if (absoluteSkipCount > 0) {
    raceGrade = '見送り';
  } else if (warningCount === 0) {
    raceGrade = '最良';
  } else if (warningCount === 1) {
    raceGrade = '良い';
  } else {
    raceGrade = '普通';
  }

  // サマリー生成
  let summary: string;
  if (shouldSkip) {
    const mainReason = reasons.find(r => r.severity === '絶対見送り');
    summary = `見送り推奨: ${mainReason?.label ?? '条件不適合'}`;
  } else if (raceGrade === '最良') {
    const axisInfo = axisHorses.length > 0
      ? `軸候補${axisHorses.length}頭`
      : '';
    summary = `好条件レース。${axisInfo}`;
  } else if (raceGrade === '良い') {
    summary = `概ね良好。${reasons[0]?.label ?? ''}に注意`;
  } else {
    summary = `注意点あり。${reasons.map(r => r.label).join('、')}`;
  }

  return {
    shouldSkip,
    confidence,
    reasons,
    raceGrade,
    axisHorses,
    partnerHorses,
    eliminatedHorses,
    summary,
    details: {
      showRateTop,
      showRateSpread,
      eliminatedCount,
      totalHorses,
      efficiencyACount,
      favoriteOdds,
    },
  };
}
