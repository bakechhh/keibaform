/**
 * 馬券購入ルール適用・購入予定生成（TypeScript移植版）
 *
 * 3モード: 通常 / 裏（穴馬流し） / 暴走（一攫千金）
 */

import { Horse, Bet, RaceBets, Race, OddsDisplay } from '../types';

// ===== 購入金額デフォルト =====
export const DEFAULT_TANSHO_AMOUNT = 100;
export const DEFAULT_WIDE_AMOUNT = 100;
export const DEFAULT_UMAREN_AMOUNT = 100;
const BET_AMOUNT_BOUSOU = 100;

// ===== ステータス日本語ラベル =====
const STATUS_JP: Record<string, string> = {
  axis_iron: '鉄板',
  axis_strong: '有力軸',
  axis_value: '妙味軸',
  value_high: '激熱',
  value: '妙味',
  ability: '実力',
  safe: '紐',
  delete: '消',
};

export function statusToJp(status: string): string {
  return STATUS_JP[status] || status;
}

// ===== 馬場調整 =====
const TRACK_CONDITION_RATES: Record<string, number> = {
  '良': 1.0,
  '稍重': 0.7,
  '重': 0.5,
  '不良': 0.3,
};

function adjustAmountForTrack(baseAmount: number, condition: string): number {
  const rate = TRACK_CONDITION_RATES[condition] ?? 1.0;
  const adjusted = baseAmount * rate;
  return Math.max(100, Math.ceil(adjusted / 100) * 100);
}

// ===== 効率係数（馬連軸用）=====
const EFFICIENCY_COEF: Record<string, number> = {
  SS: 1.7, S: 1.6, 'A+': 1.5, A: 1.4, 'B+': 1.2,
  B: 1.0, 'C+': 1.0, C: 1.0, D: 1.0, '-': 1.0,
};

// ===== 効率判定ヘルパー =====
export function effScore(rank: string): number {
  const scores: Record<string, number> = {
    SS: 8, S: 7, 'A+': 6, A: 5, 'B+': 4, B: 3, 'C+': 2, C: 1, D: 0, '-': -1,
  };
  return scores[rank] ?? -1;
}

function isEffBOrAbove(horse: Horse): boolean {
  return effScore(horse.efficiency.rank) >= effScore('B');
}

function isEffBplusOrAbove(horse: Horse): boolean {
  return effScore(horse.efficiency.rank) >= effScore('B+');
}

function isEffAOrAbove(horse: Horse): boolean {
  return effScore(horse.efficiency.rank) >= effScore('A');
}

function isEffAplus(horse: Horse): boolean {
  return horse.efficiency.rank === 'A+';
}

// ===== オッズマップビルダー =====
export function buildWideOddsMap(odds: OddsDisplay | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!odds) return map;
  for (const w of odds.wide) {
    const nums = w.combination.split(/[-=]/).map(Number).sort((a, b) => a - b);
    if (nums.length === 2) {
      map.set(`${nums[0]}-${nums[1]}`, w.min);
    }
  }
  return map;
}

export function buildUmarenOddsMap(odds: OddsDisplay | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!odds) return map;
  for (const u of odds.umaren) {
    const nums = u.combination.split(/[-=]/).map(Number).sort((a, b) => a - b);
    if (nums.length === 2) {
      map.set(`${nums[0]}-${nums[1]}`, u.odds);
    }
  }
  return map;
}

function getOddsFromMap(map: Map<string, number>, uma1: number, uma2: number): number {
  const key = `${Math.min(uma1, uma2)}-${Math.max(uma1, uma2)}`;
  return map.get(key) ?? 0;
}

// ===== 単勝判定 =====
function shouldBuyTansho(horse: Horse): string | null {
  const status = horse.analysis.status;
  const effRank = horse.efficiency.rank;

  if (status === 'axis_iron' && isEffBOrAbove(horse)) {
    return `鉄板+${effRank}`;
  }
  if (status === 'ability' && isEffBplusOrAbove(horse)) {
    return `実力+${effRank}`;
  }
  if (status === 'safe' && isEffBplusOrAbove(horse)) {
    return `紐+${effRank}`;
  }
  return null;
}

// ===== ワイド軸 =====
function getWideAxisHorse(horses: Horse[], tanshoUmabans: number[]): Horse | null {
  let best: Horse | null = null;
  let bestScore = -Infinity;

  for (const horse of horses) {
    if (!tanshoUmabans.includes(horse.number)) continue;

    const showRate = horse.predictions.show_rate ?? 0;
    const finalScore = horse.indices.final_score ?? 0;
    const score = showRate * 100 + finalScore;
    if (score > bestScore) {
      bestScore = score;
      best = horse;
    }
  }
  return best;
}

// ===== 馬連軸 =====
function getUmarenAxisHorse(horses: Horse[], tanshoUmabans: number[]): Horse | null {
  let best: Horse | null = null;
  let bestScore = -Infinity;

  for (const horse of horses) {
    if (!tanshoUmabans.includes(horse.number)) continue;

    const placeRate = horse.predictions.place_rate ?? 0;
    const finalScore = horse.indices.final_score ?? 0;
    const coef = EFFICIENCY_COEF[horse.efficiency.rank] ?? 1.0;
    const score = (placeRate * 100 + finalScore) * coef;
    if (score > bestScore) {
      bestScore = score;
      best = horse;
    }
  }
  return best;
}

// ===== ワイド/馬連 相手馬 =====
function getWidePartnerHorses(
  horses: Horse[],
  axisUmaban: number,
  tanshoHorses: number[]
): Horse[] {
  const partners: Horse[] = [];
  const added = new Set<number>();

  for (const horse of horses) {
    if (horse.number === axisUmaban) continue;
    if (added.has(horse.number)) continue;

    const status = horse.analysis.status;

    // 1. 単勝購入馬
    if (tanshoHorses.includes(horse.number)) {
      partners.push(horse);
      added.add(horse.number);
      continue;
    }
    // 2. 鉄板・実力・紐 + 効率A以上
    if (['axis_iron', 'ability', 'safe'].includes(status) && isEffAOrAbove(horse)) {
      partners.push(horse);
      added.add(horse.number);
      continue;
    }
    // 3. 妙味 + 効率A+
    if (status === 'value' && isEffAplus(horse)) {
      partners.push(horse);
      added.add(horse.number);
      continue;
    }
  }
  return partners;
}

// ===== 通常モード =====
export function generateRaceBets(
  race: Race,
  horses: Horse[],
  wideOddsMap: Map<string, number>,
  umarenOddsMap: Map<string, number>,
  tanshoAmount: number = DEFAULT_TANSHO_AMOUNT,
  wideAmount: number = DEFAULT_WIDE_AMOUNT,
  umarenAmount: number = DEFAULT_UMAREN_AMOUNT,
): RaceBets | null {
  if (horses.length === 0) return null;

  const trackCondition = race.trackCondition ?? '良';
  const adjTansho = adjustAmountForTrack(tanshoAmount, trackCondition);
  const adjWide = adjustAmountForTrack(wideAmount, trackCondition);
  const adjUmaren = adjustAmountForTrack(umarenAmount, trackCondition);

  const bets: Bet[] = [];
  const tanshoHorses: number[] = [];

  // 単勝
  for (const horse of horses) {
    const reason = shouldBuyTansho(horse);
    if (reason) {
      tanshoHorses.push(horse.number);
      bets.push({
        type: '単勝',
        umaban: horse.number,
        umaban2: 0,
        name: horse.name,
        amount: adjTansho,
        reason,
        odds: horse.tanshoOdds,
      });
    }
  }

  // ワイド
  const wideAxis = getWideAxisHorse(horses, tanshoHorses);
  if (wideAxis) {
    const partners = getWidePartnerHorses(horses, wideAxis.number, tanshoHorses);
    for (const partner of partners) {
      bets.push({
        type: 'ワイド',
        umaban: wideAxis.number,
        umaban2: partner.number,
        name: `${wideAxis.name}→${partner.name}`,
        amount: adjWide,
        reason: `軸${wideAxis.number}→${partner.number}`,
        odds: getOddsFromMap(wideOddsMap, wideAxis.number, partner.number),
      });
    }
  }

  // 馬連
  const umarenAxis = getUmarenAxisHorse(horses, tanshoHorses);
  if (umarenAxis) {
    const partners = getWidePartnerHorses(horses, umarenAxis.number, tanshoHorses);
    for (const partner of partners) {
      bets.push({
        type: '馬連',
        umaban: umarenAxis.number,
        umaban2: partner.number,
        name: `${umarenAxis.name}=${partner.name}`,
        amount: adjUmaren,
        reason: `軸${umarenAxis.number}=${partner.number}`,
        odds: getOddsFromMap(umarenOddsMap, umarenAxis.number, partner.number),
      });
    }
  }

  if (bets.length === 0) return null;

  return {
    venue: race.location,
    raceNum: race.round,
    totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
    bets,
  };
}

// ===== 裏モード（穴馬流し）=====

function isAnaAxis(horse: Horse): boolean {
  const status = horse.analysis.status;
  const effRank = horse.efficiency.rank;
  const isEffAOrBetter = effScore(effRank) >= effScore('A');

  return (
    (status === 'value' && effRank === 'A+') ||
    (status === 'safe' && effRank === 'S') ||
    (status === 'safe' && effRank === 'A') ||
    (status === 'axis_iron' && isEffAOrBetter) ||
    (status === 'axis_strong' && isEffAOrBetter) ||
    (status === 'value_high') ||
    (status === 'ability' && isEffAOrBetter)
  );
}

function isAnaAiteOnly(horse: Horse, anaAxisUmabans: number[]): boolean {
  if (anaAxisUmabans.includes(horse.number)) return false;

  const status = horse.analysis.status;
  const effRank = horse.efficiency.rank;

  return (
    (status === 'ability' && effRank === 'C+') ||
    (status === 'axis_iron' && effRank === 'C') ||
    (status === 'axis_iron' && ['A', 'S', 'SS'].includes(effRank)) ||
    (status === 'ability' && ['A', 'S', 'SS'].includes(effRank)) ||
    (status === 'safe' && ['A', 'S', 'SS'].includes(effRank)) ||
    (status === 'axis_value') ||
    (status === 'axis_strong' && effRank === 'B+')
  );
}

function getAnaAiteCandidates(horses: Horse[], anaAxisUmabans: number[]): Horse[] {
  const BUY_STATUSES = ['axis_iron', 'axis_strong', 'axis_value', 'ability', 'safe'];

  const candidates = horses.filter(
    h => !anaAxisUmabans.includes(h.number) &&
         BUY_STATUSES.includes(h.analysis.status) &&
         h.powerRank <= 5
  );

  candidates.sort((a, b) => a.powerRank - b.powerRank);
  return candidates.slice(0, 3);
}

export function generateRaceBetsUra(
  race: Race,
  horses: Horse[],
  wideOddsMap: Map<string, number>,
  umarenOddsMap: Map<string, number>,
  tanshoAmount: number = DEFAULT_TANSHO_AMOUNT,
  wideAmount: number = DEFAULT_WIDE_AMOUNT,
  umarenAmount: number = DEFAULT_UMAREN_AMOUNT,
): RaceBets | null {
  if (horses.length === 0) return null;

  const trackCondition = race.trackCondition ?? '良';
  const adjTansho = adjustAmountForTrack(tanshoAmount, trackCondition);
  const adjWide = adjustAmountForTrack(wideAmount, trackCondition);
  const adjUmaren = adjustAmountForTrack(umarenAmount, trackCondition);

  const bets: Bet[] = [];

  // 穴軸候補を抽出
  const anaAxes = horses.filter(isAnaAxis);
  if (anaAxes.length === 0) return null;

  const anaAxisUmabans = anaAxes.map(h => h.number);

  // 相手のみ候補
  const aiteOnly = horses.filter(h => isAnaAiteOnly(h, anaAxisUmabans));
  const aiteOnlyUmabans = aiteOnly.map(h => h.number);

  // 1. 穴軸全頭の単勝
  for (const horse of anaAxes) {
    const statusJp = statusToJp(horse.analysis.status);
    bets.push({
      type: '単勝',
      umaban: horse.number,
      umaban2: 0,
      name: horse.name,
      amount: adjTansho,
      reason: `穴軸:${statusJp}+${horse.efficiency.rank}`,
      odds: horse.tanshoOdds,
    });
  }

  // 2. ワイド・馬連は効率最高の1頭を軸
  const EFF_ORDER: Record<string, number> = {
    SS: 0, S: 1, 'A+': 2, A: 3, 'B+': 4, B: 5, 'C+': 6, C: 7, D: 8, '-': 9,
  };
  const sortedAxes = [...anaAxes].sort(
    (a, b) => (EFF_ORDER[a.efficiency.rank] ?? 9) - (EFF_ORDER[b.efficiency.rank] ?? 9)
  );
  const bestAxis = sortedAxes[0];

  // 上位馬取得
  const aiteList = getAnaAiteCandidates(horses, anaAxisUmabans);

  // 全相手候補リスト構築
  const umarenAite: Horse[] = [];
  const addedUmabans = new Set<number>();

  // 残りの穴軸馬
  for (const h of anaAxes) {
    if (h.number !== bestAxis.number && !addedUmabans.has(h.number)) {
      umarenAite.push(h);
      addedUmabans.add(h.number);
    }
  }
  // 相手のみ候補
  for (const h of aiteOnly) {
    if (!addedUmabans.has(h.number)) {
      umarenAite.push(h);
      addedUmabans.add(h.number);
    }
  }
  // 上位馬（穴軸・相手のみ以外）
  for (const h of aiteList) {
    if (!anaAxisUmabans.includes(h.number) && !aiteOnlyUmabans.includes(h.number) && !addedUmabans.has(h.number)) {
      umarenAite.push(h);
      addedUmabans.add(h.number);
    }
  }

  // ワイド
  for (const aite of umarenAite) {
    const aiteStatusJp = statusToJp(aite.analysis.status);
    bets.push({
      type: 'ワイド',
      umaban: bestAxis.number,
      umaban2: aite.number,
      name: `${bestAxis.name}→${aite.name}`,
      amount: adjWide,
      reason: `穴軸${bestAxis.number}→${aite.number}(${aiteStatusJp})`,
      odds: getOddsFromMap(wideOddsMap, bestAxis.number, aite.number),
    });
  }

  // 馬連
  for (const aite of umarenAite) {
    const aiteStatusJp = statusToJp(aite.analysis.status);
    bets.push({
      type: '馬連',
      umaban: bestAxis.number,
      umaban2: aite.number,
      name: `${bestAxis.name}=${aite.name}`,
      amount: adjUmaren,
      reason: `穴軸${bestAxis.number}=${aite.number}(${aiteStatusJp})`,
      odds: getOddsFromMap(umarenOddsMap, bestAxis.number, aite.number),
    });
  }

  if (bets.length === 0) return null;

  return {
    venue: race.location,
    raceNum: race.round,
    totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
    bets,
  };
}

// ===== 暴走モード =====

function passesBousouScoreCondition(
  horse: Horse,
  skipCorrectedTime: boolean
): { passes: boolean; reason: string } {
  const showRate = horse.predictions.show_rate ?? 0;
  const winRate = horse.predictions.win_rate ?? 0;
  const placeRate = horse.predictions.place_rate ?? 0;
  const finalScore = horse.indices.final_score ?? 0;
  const correctedTimeDev = horse.indices.corrected_time_deviation ?? 0;
  const miningIndex = horse.indices.mining_index ?? 0;
  const battleMining = horse.battleMining ?? 0;

  if (showRate >= 0.47) return { passes: true, reason: `複勝AI${showRate.toFixed(2)}` };
  if (finalScore >= 47) return { passes: true, reason: `FS${Math.round(finalScore)}` };
  if (winRate >= 0.50) return { passes: true, reason: `単勝AI${winRate.toFixed(2)}` };
  if (placeRate >= 0.50) return { passes: true, reason: `連対AI${placeRate.toFixed(2)}` };
  if (showRate >= 0.50) return { passes: true, reason: `複勝AI${showRate.toFixed(2)}` };
  if (finalScore >= 50) return { passes: true, reason: `FS${Math.round(finalScore)}` };
  if (!skipCorrectedTime && correctedTimeDev >= 50) return { passes: true, reason: `補正タイム偏差${Math.round(correctedTimeDev)}` };
  if (miningIndex >= 50) return { passes: true, reason: `採掘${Math.round(miningIndex)}` };
  if (battleMining >= 50) return { passes: true, reason: `戦闘採掘${Math.round(battleMining)}` };

  return { passes: false, reason: '' };
}

interface BousouTarget {
  horse: Horse;
  umaban: number;
  name: string;
  statusJp: string;
  reason: string;
  effRank: string;
  bousouScore: number;
}

function isBousouTarget(
  horse: Horse,
  skipCorrectedTime: boolean
): { isTarget: boolean; statusJp: string; reason: string } {
  const status = horse.analysis.status;
  const effRank = horse.efficiency.rank;

  if (status === 'delete') return { isTarget: false, statusJp: '', reason: '' };
  if (effScore(effRank) < effScore('A+')) return { isTarget: false, statusJp: '', reason: '' };

  const { passes, reason } = passesBousouScoreCondition(horse, skipCorrectedTime);
  if (!passes) return { isTarget: false, statusJp: '', reason: '' };

  const sJp = statusToJp(status);
  return { isTarget: true, statusJp: sJp, reason: `${sJp}+${effRank}(${reason})` };
}

export function generateRaceBetsBousou(
  race: Race,
  horses: Horse[],
  wideOddsMap: Map<string, number>,
  umarenOddsMap: Map<string, number>,
  wideAmount: number = BET_AMOUNT_BOUSOU,
  umarenAmount: number = BET_AMOUNT_BOUSOU,
): RaceBets | null {
  if (horses.length === 0) return null;

  const trackCondition = race.trackCondition ?? '良';
  const adjWide = adjustAmountForTrack(wideAmount, trackCondition);
  const adjUmaren = adjustAmountForTrack(umarenAmount, trackCondition);

  // 新馬判定
  let ct50Count = 0;
  for (const h of horses) {
    if ((h.indices.corrected_time_deviation ?? 0) === 50) ct50Count++;
  }
  const skipCorrectedTime = ct50Count >= 3;

  // 対象馬を抽出
  const targets: BousouTarget[] = [];
  for (const horse of horses) {
    const { isTarget, statusJp, reason } = isBousouTarget(horse, skipCorrectedTime);
    if (isTarget) {
      targets.push({
        horse,
        umaban: horse.number,
        name: horse.name,
        statusJp,
        reason,
        effRank: horse.efficiency.rank,
        bousouScore: 0,
      });
    }
  }

  if (targets.length === 0) return null;

  // 再評価スコア
  const EFF_COEF_BOUSOU: Record<string, number> = { SS: 1.5, S: 1.2 };

  const rawScores = targets.map(t => ({
    winRate: t.horse.predictions.win_rate ?? 0,
    finalScore: t.horse.indices.final_score ?? 0,
    miningIndex: t.horse.indices.mining_index ?? 0,
  }));

  const normalize = (values: number[]): number[] => {
    if (values.length === 0) return values;
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return values.map(() => 0.5);
    return values.map(v => (v - min) / (max - min));
  };

  const wrNorm = normalize(rawScores.map(s => s.winRate));
  const fsNorm = normalize(rawScores.map(s => s.finalScore));
  const miNorm = normalize(rawScores.map(s => s.miningIndex));

  for (let i = 0; i < targets.length; i++) {
    const base = wrNorm[i] + fsNorm[i] + miNorm[i];
    const coef = EFF_COEF_BOUSOU[targets[i].effRank] ?? 1.0;
    targets[i].bousouScore = base * coef;
  }

  // ワイド軸: 再評価スコア上位2頭
  const wideAxisTargets = [...targets].sort((a, b) => b.bousouScore - a.bousouScore).slice(0, 2);

  const bets: Bet[] = [];

  // 1. ワイド: 軸2頭 × 他の対象馬への流し
  const seenWide = new Set<string>();
  for (const axis of wideAxisTargets) {
    for (const t of targets) {
      if (t.umaban === axis.umaban) continue;
      const key = `${Math.min(axis.umaban, t.umaban)}-${Math.max(axis.umaban, t.umaban)}`;
      if (seenWide.has(key)) continue;
      seenWide.add(key);

      bets.push({
        type: 'ワイド',
        umaban: axis.umaban,
        umaban2: t.umaban,
        name: `${axis.name}→${t.name}`,
        amount: adjWide,
        reason: `暴走:${axis.reason} → ${t.reason}`,
        odds: getOddsFromMap(wideOddsMap, axis.umaban, t.umaban),
      });
    }
  }

  // 2. 馬連: 対象馬同士の全組み合わせBOX
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const t1 = targets[i];
      const t2 = targets[j];
      bets.push({
        type: '馬連',
        umaban: t1.umaban,
        umaban2: t2.umaban,
        name: `${t1.name}=${t2.name}`,
        amount: adjUmaren,
        reason: `暴走:${t1.reason} × ${t2.reason}`,
        odds: getOddsFromMap(umarenOddsMap, t1.umaban, t2.umaban),
      });
    }
  }

  if (bets.length === 0) return null;

  return {
    venue: race.location,
    raceNum: race.round,
    totalAmount: bets.reduce((sum, b) => sum + b.amount, 0),
    bets,
  };
}
