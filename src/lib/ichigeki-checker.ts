/**
 * 一撃購入条件チェッカー
 * 6つのAND条件 + 一撃パターン合成オッズ上限で判定
 */

import { Race, OddsDisplay, FormationResult, FormationPattern } from '../types';
import { calcFormationSyntheticOdds, buildSanrenpukuOddsMap, buildSanrentanOddsMap } from './synthetic-odds';

export interface IchigekiCondition {
  label: string;
  description: string;
  passed: boolean;
  value: string;
  threshold: string;
}

// 一撃パターン合成オッズ上限
const ICHIGEKI_SP_MAX = 8.0;   // 三連複: これ以上は対象外
const ICHIGEKI_ST_MAX = 40.0;  // 三連単: これ以上は対象外
const ICHIGEKI_SP_SEMI = 6.5;  // 三連複: 準勝負の上限
const ICHIGEKI_ST_SEMI = 30.0; // 三連単: 準勝負の上限

export type IchigekiLevel = 'eligible' | 'semi' | 'ineligible';

export interface IchigekiEligibility {
  eligible: boolean;
  level: IchigekiLevel;
  conditions: IchigekiCondition[];
  avgSanrenpukuSynOdds: number | null;
  avgSanrentanSynOdds: number | null;
  ichigekiSpSynOdds: number | null;
  ichigekiStSynOdds: number | null;
}

/**
 * オッズ不要のクイックチェック（①④⑤⑥）
 * 全レース一覧で候補表示するために使う
 */
export interface IchigekiQuickResult {
  candidate: boolean;
  favoriteOdds: number;
  horseCount: number;
  failReasons: string[];
}

export function quickCheckIchigeki(race: Race): IchigekiQuickResult {
  const failReasons: string[] = [];

  // ① 1番人気オッズ >= 3.0（Horse.tanshoOddsから取得）
  const favorite = race.horses.reduce(
    (min, h) => (h.tanshoOdds > 0 && h.tanshoOdds < min.tanshoOdds) ? h : min,
    race.horses[0],
  );
  const favoriteOdds = favorite?.tanshoOdds ?? 0;
  if (favoriteOdds < 3.0) failReasons.push(`1人気${favoriteOdds.toFixed(1)}倍`);

  // ④ 新馬除外
  if (race.condition.includes('新馬')) failReasons.push('新馬');

  // ⑤ 12頭以上
  const horseCount = race.horses.length;
  if (horseCount < 12) failReasons.push(`${horseCount}頭`);

  // ⑥ 堅実除外
  if (race.evaluation.type === 'SOLID') failReasons.push('堅実');

  return {
    candidate: failReasons.length === 0,
    favoriteOdds,
    horseCount,
    failReasons,
  };
}

function isIchigekiPattern(p: FormationPattern): boolean {
  return p.name.includes('一撃');
}

export function checkIchigekiEligibility(
  race: Race,
  odds: OddsDisplay | null,
  formationResult: FormationResult,
): IchigekiEligibility {
  const spOddsMap = buildSanrenpukuOddsMap(odds);
  const stOddsMap = buildSanrentanOddsMap(odds);

  // ① 1番人気の単勝オッズ >= 3.0
  const tanshoSorted = odds?.tansho
    ? [...odds.tansho].sort((a, b) => a.odds - b.odds)
    : [];
  const favoriteOdds = tanshoSorted.length > 0 ? tanshoSorted[0].odds : 0;
  const cond1: IchigekiCondition = {
    label: '1番人気オッズ',
    description: '1番人気の単勝オッズが3.0倍以上',
    passed: favoriteOdds >= 3.0,
    value: favoriteOdds > 0 ? `${favoriteOdds.toFixed(1)}倍` : '不明',
    threshold: '>= 3.0倍',
  };

  // ② 三連複の合成オッズ平均 <= 5.0（一撃以外のパターン）
  const nonIchigekiSp = formationResult.sanrenpuku.filter(p => !isIchigekiPattern(p));
  const spSynOddsArr = nonIchigekiSp
    .map(p => calcFormationSyntheticOdds(p, '三連複', spOddsMap, stOddsMap))
    .filter((v): v is number => v !== null);
  const avgSpSyn = spSynOddsArr.length > 0
    ? spSynOddsArr.reduce((a, b) => a + b, 0) / spSynOddsArr.length
    : null;
  const cond2: IchigekiCondition = {
    label: '三連複合成オッズ平均',
    description: '一撃以外の三連複パターンの合成オッズ平均が5.0以下',
    passed: avgSpSyn !== null && avgSpSyn <= 5.0,
    value: avgSpSyn !== null ? `${avgSpSyn.toFixed(2)}倍` : '算出不可',
    threshold: '<= 5.0',
  };

  // ③ 三連単の合成オッズ平均 >= 10.0 かつ <= 25.0（一撃以外のパターン）
  const nonIchigekiSt = formationResult.sanrentan.filter(p => !isIchigekiPattern(p));
  const stSynOddsArr = nonIchigekiSt
    .map(p => calcFormationSyntheticOdds(p, '三連単', spOddsMap, stOddsMap))
    .filter((v): v is number => v !== null);
  const avgStSyn = stSynOddsArr.length > 0
    ? stSynOddsArr.reduce((a, b) => a + b, 0) / stSynOddsArr.length
    : null;
  const cond3: IchigekiCondition = {
    label: '三連単合成オッズ平均',
    description: '一撃以外の三連単パターンの合成オッズ平均が10.0〜25.0',
    passed: avgStSyn !== null && avgStSyn >= 10.0 && avgStSyn <= 25.0,
    value: avgStSyn !== null ? `${avgStSyn.toFixed(2)}倍` : '算出不可',
    threshold: '10.0 〜 25.0',
  };

  // ④ 新馬レース除外
  const isNewbie = race.condition.includes('新馬');
  const cond4: IchigekiCondition = {
    label: '新馬レース除外',
    description: '新馬レースではないこと',
    passed: !isNewbie,
    value: isNewbie ? '新馬' : '対象外',
    threshold: '新馬以外',
  };

  // ⑤ 出走頭数 >= 12
  const horseCount = race.horses.length;
  const cond5: IchigekiCondition = {
    label: '出走頭数',
    description: '12頭以上の出走があること',
    passed: horseCount >= 12,
    value: `${horseCount}頭`,
    threshold: '>= 12頭',
  };

  // ⑥ 堅実レース除外
  const isSolid = race.evaluation.type === 'SOLID';
  const cond6: IchigekiCondition = {
    label: '堅実レース除外',
    description: '堅実レースではないこと',
    passed: !isSolid,
    value: isSolid ? '堅実' : race.evaluation.label,
    threshold: '堅実以外',
  };

  // 一撃パターン自体の合成オッズ
  const ichigekiSpPattern = formationResult.sanrenpuku.find(p => isIchigekiPattern(p));
  const ichigekiStPattern = formationResult.sanrentan.find(p => isIchigekiPattern(p));
  const ichigekiSpSynOdds = ichigekiSpPattern
    ? calcFormationSyntheticOdds(ichigekiSpPattern, '三連複', spOddsMap, stOddsMap)
    : null;
  const ichigekiStSynOdds = ichigekiStPattern
    ? calcFormationSyntheticOdds(ichigekiStPattern, '三連単', spOddsMap, stOddsMap)
    : null;

  // ⑦ 一撃パターン合成オッズ上限チェック
  const spOver = ichigekiSpSynOdds !== null && ichigekiSpSynOdds >= ICHIGEKI_SP_MAX;
  const stOver = ichigekiStSynOdds !== null && ichigekiStSynOdds >= ICHIGEKI_ST_MAX;
  const oddsOverAny = spOver || stOver;
  const cond7: IchigekiCondition = {
    label: '一撃合成オッズ上限',
    description: `一撃パターン: 三連複<${ICHIGEKI_SP_MAX}倍 かつ 三連単<${ICHIGEKI_ST_MAX}倍`,
    passed: !oddsOverAny,
    value: [
      ichigekiSpSynOdds !== null ? `複${ichigekiSpSynOdds.toFixed(2)}` : '複-',
      ichigekiStSynOdds !== null ? `単${ichigekiStSynOdds.toFixed(2)}` : '単-',
    ].join(' / '),
    threshold: `複<${ICHIGEKI_SP_MAX} 単<${ICHIGEKI_ST_MAX}`,
  };

  const conditions = [cond1, cond2, cond3, cond4, cond5, cond6, cond7];
  const baseEligible = conditions.every(c => c.passed);

  // レベル判定
  let level: IchigekiLevel = 'ineligible';
  if (baseEligible) {
    level = 'eligible';
  } else if (
    // 条件①〜⑥は全て合格だが⑦だけ不合格 → 準勝負の可能性
    [cond1, cond2, cond3, cond4, cond5, cond6].every(c => c.passed)
    && oddsOverAny
  ) {
    // 準勝負: 緩和閾値内なら準勝負レース
    const spOk = ichigekiSpSynOdds === null || ichigekiSpSynOdds < ICHIGEKI_SP_SEMI;
    const stOk = ichigekiStSynOdds === null || ichigekiStSynOdds < ICHIGEKI_ST_SEMI;
    if (spOk && stOk) {
      level = 'semi';
    }
  }

  return {
    eligible: level === 'eligible',
    level,
    conditions,
    avgSanrenpukuSynOdds: avgSpSyn,
    avgSanrentanSynOdds: avgStSyn,
    ichigekiSpSynOdds,
    ichigekiStSynOdds,
  };
}
