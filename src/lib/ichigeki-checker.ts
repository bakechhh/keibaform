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
const ICHIGEKI_ST_MIN = 1.2;   // 三連単: これ未満は対象外（堅すぎる）

export type IchigekiLevel = 'eligible' | 'semi' | 'ineligible';

export interface IchigekiEligibility {
  eligible: boolean;
  level: IchigekiLevel;
  weak: boolean;           // 新馬 or 12頭未満（買えるが弱い）
  weakReasons: string[];
  conditions: IchigekiCondition[];
  avgSanrenpukuSynOdds: number | null;
  avgSanrentanSynOdds: number | null;
  ichigekiSpSynOdds: number | null;
  ichigekiStSynOdds: number | null;
}

/**
 * オッズ不要のクイックチェック（①⑥のみ）
 * ④新馬・⑤12頭未満はソフト条件（弱マーカー）なので除外しない
 */
export interface IchigekiQuickResult {
  candidate: boolean;
  favoriteOdds: number;
  horseCount: number;
  failReasons: string[];
}

export function quickCheckIchigeki(race: Race): IchigekiQuickResult {
  const failReasons: string[] = [];

  // ① 1番人気オッズ >= 2.5（Horse.tanshoOddsから取得）
  const favorite = race.horses.reduce(
    (min, h) => (h.tanshoOdds > 0 && h.tanshoOdds < min.tanshoOdds) ? h : min,
    race.horses[0],
  );
  const favoriteOdds = favorite?.tanshoOdds ?? 0;
  if (favoriteOdds < 2.5) failReasons.push(`1人気${favoriteOdds.toFixed(1)}倍`);

  return {
    candidate: failReasons.length === 0,
    favoriteOdds,
    horseCount: race.horses.length,
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

  // ① 1番人気の単勝オッズ >= 2.5
  const tanshoSorted = odds?.tansho
    ? [...odds.tansho].sort((a, b) => a.odds - b.odds)
    : [];
  const favoriteOdds = tanshoSorted.length > 0 ? tanshoSorted[0].odds : 0;
  const cond1: IchigekiCondition = {
    label: '1番人気オッズ',
    description: '1番人気の単勝オッズが2.5倍以上',
    passed: favoriteOdds >= 2.5,
    value: favoriteOdds > 0 ? `${favoriteOdds.toFixed(1)}倍` : '不明',
    threshold: '>= 2.5倍',
  };

  // ② 三連複の合成オッズ平均 <= 6.0（一撃以外のパターン）
  const nonIchigekiSp = formationResult.sanrenpuku.filter(p => !isIchigekiPattern(p));
  const spSynOddsArr = nonIchigekiSp
    .map(p => calcFormationSyntheticOdds(p, '三連複', spOddsMap, stOddsMap))
    .filter((v): v is number => v !== null);
  const avgSpSyn = spSynOddsArr.length > 0
    ? spSynOddsArr.reduce((a, b) => a + b, 0) / spSynOddsArr.length
    : null;
  const cond2: IchigekiCondition = {
    label: '三連複合成オッズ平均',
    description: '一撃以外の三連複パターンの合成オッズ平均が6.0以下',
    passed: avgSpSyn !== null && avgSpSyn <= 6.0,
    value: avgSpSyn !== null ? `${avgSpSyn.toFixed(2)}倍` : '算出不可',
    threshold: '<= 6.0',
  };

  // ③ 三連単の合成オッズ平均 >= 8.0 かつ <= 30.0（一撃以外のパターン）
  const nonIchigekiSt = formationResult.sanrentan.filter(p => !isIchigekiPattern(p));
  const stSynOddsArr = nonIchigekiSt
    .map(p => calcFormationSyntheticOdds(p, '三連単', spOddsMap, stOddsMap))
    .filter((v): v is number => v !== null);
  const avgStSyn = stSynOddsArr.length > 0
    ? stSynOddsArr.reduce((a, b) => a + b, 0) / stSynOddsArr.length
    : null;
  const cond3: IchigekiCondition = {
    label: '三連単合成オッズ平均',
    description: '一撃以外の三連単パターンの合成オッズ平均が8.0〜30.0',
    passed: avgStSyn !== null && avgStSyn >= 8.0 && avgStSyn <= 30.0,
    value: avgStSyn !== null ? `${avgStSyn.toFixed(2)}倍` : '算出不可',
    threshold: '8.0 〜 30.0',
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

  // ⑥ 堅実レース除外 - 撤廃
  // const isSolid = race.evaluation.type === 'SOLID';
  // const cond6: IchigekiCondition = {
  //   label: '堅実レース除外',
  //   description: '堅実レースではないこと',
  //   passed: !isSolid,
  //   value: isSolid ? '堅実' : race.evaluation.label,
  //   threshold: '堅実以外',
  // };

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

  // ⑧ 一撃三連単合成オッズ下限チェック（堅すぎるレース除外）
  const stUnder = ichigekiStSynOdds !== null && ichigekiStSynOdds < ICHIGEKI_ST_MIN;
  const cond8: IchigekiCondition = {
    label: '一撃三連単合成オッズ下限',
    description: `一撃パターン: 三連単>=${ICHIGEKI_ST_MIN}倍`,
    passed: !stUnder,
    value: ichigekiStSynOdds !== null ? `単${ichigekiStSynOdds.toFixed(2)}` : '単-',
    threshold: `単>=${ICHIGEKI_ST_MIN}`,
  };

  const conditions = [cond1, cond2, cond3, cond4, cond5, cond7, cond8];

  // コア条件: ①②③⑦⑧（④⑤はソフト条件→弱マーカー、⑥堅実除外は撤廃）
  const coreConditions = [cond1, cond2, cond3, cond7, cond8];
  const coreEligible = coreConditions.every(c => c.passed);

  // ④⑤は弱マーカー（買えるが信頼度低い）
  const weakReasons: string[] = [];
  if (!cond4.passed) weakReasons.push('新馬');
  if (!cond5.passed) weakReasons.push(`${race.horses.length}頭`);
  const weak = weakReasons.length > 0;

  // レベル判定（④⑤は無関係）
  let level: IchigekiLevel = 'ineligible';
  if (coreEligible) {
    level = 'eligible';
  } else if (
    // コア条件①②③は合格だが⑦だけ不合格 → 準勝負の可能性
    [cond1, cond2, cond3].every(c => c.passed)
    && oddsOverAny
  ) {
    const spOk = ichigekiSpSynOdds === null || ichigekiSpSynOdds < ICHIGEKI_SP_SEMI;
    const stOk = ichigekiStSynOdds === null || ichigekiStSynOdds < ICHIGEKI_ST_SEMI;
    if (spOk && stOk) {
      level = 'semi';
    }
  }

  return {
    eligible: level === 'eligible',
    level,
    weak,
    weakReasons,
    conditions,
    avgSanrenpukuSynOdds: avgSpSyn,
    avgSanrentanSynOdds: avgStSyn,
    ichigekiSpSynOdds,
    ichigekiStSynOdds,
  };
}
