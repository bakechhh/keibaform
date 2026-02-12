/**
 * 三連複・三連単フォーメーション生成（3モード統合版）
 * TypeScript移植版
 */

import { Horse, Bet, ScoredHorse, FormationPattern, FormationResult } from '../types';
import { effScore, statusToJp } from './bet-generator';

// ===== スコアリング =====

export function buildIntegratedScores(
  horses: Horse[],
  modeBets: Record<string, Bet[]>
): ScoredHorse[] {
  const scores: Record<number, {
    total: number; normal: number; ura: number; bousou: number;
    modesCount: number; roles: string[];
  }> = {};
  const horseMap: Record<number, Horse> = {};

  for (const h of horses) {
    scores[h.number] = { total: 0, normal: 0, ura: 0, bousou: 0, modesCount: 0, roles: [] };
    horseMap[h.number] = h;
  }

  for (const [mode, bets] of Object.entries(modeBets)) {
    if (!bets || bets.length === 0) continue;

    const appeared = new Set<number>();
    const axisCount: Record<number, number> = {};

    for (const b of bets) {
      if (b.type === 'ワイド' || b.type === '馬連') {
        axisCount[b.umaban] = (axisCount[b.umaban] ?? 0) + 1;
      }
    }

    for (const b of bets) {
      const sc = scores[b.umaban];
      if (!sc) continue;

      if (b.type === '単勝') {
        sc[mode as 'normal' | 'ura' | 'bousou'] += 3;
        sc.total += 3;
        sc.roles.push(`${mode}:単勝`);
        appeared.add(b.umaban);
      } else if (b.type === 'ワイド') {
        const isAxis = (axisCount[b.umaban] ?? 0) >= 2;
        const pts = isAxis ? 3 : 1;
        const roleKey = `${mode}:ワ軸`;
        if (!sc.roles.includes(roleKey)) {
          sc[mode as 'normal' | 'ura' | 'bousou'] += pts;
          sc.total += pts;
          if (isAxis) sc.roles.push(roleKey);
        }
        appeared.add(b.umaban);

        if (b.umaban2 && scores[b.umaban2]) {
          const sc2 = scores[b.umaban2];
          const roleKey2 = `${mode}:ワ相手`;
          if (!sc2.roles.includes(roleKey2)) {
            sc2[mode as 'normal' | 'ura' | 'bousou'] += 1;
            sc2.total += 1;
            sc2.roles.push(roleKey2);
          }
          appeared.add(b.umaban2);
        }
      } else if (b.type === '馬連') {
        const isAxis = (axisCount[b.umaban] ?? 0) >= 2;
        const pts = isAxis ? 2 : 1;
        const roleKey = `${mode}:連軸`;
        if (!sc.roles.includes(roleKey)) {
          sc[mode as 'normal' | 'ura' | 'bousou'] += pts;
          sc.total += pts;
          if (isAxis) sc.roles.push(roleKey);
        }
        appeared.add(b.umaban);

        if (b.umaban2 && scores[b.umaban2]) {
          const sc2 = scores[b.umaban2];
          const roleKey2 = `${mode}:連相手`;
          if (!sc2.roles.includes(roleKey2)) {
            sc2[mode as 'normal' | 'ura' | 'bousou'] += 1;
            sc2.total += 1;
            sc2.roles.push(roleKey2);
          }
          appeared.add(b.umaban2);
        }
      }
    }

    for (const uma of appeared) {
      if (scores[uma]) scores[uma].modesCount += 1;
    }
  }

  const result: ScoredHorse[] = [];
  for (const [umabanStr, sc] of Object.entries(scores)) {
    const umaban = Number(umabanStr);
    const h = horseMap[umaban];
    if (!h) continue;

    const total = sc.total;
    let rank: ScoredHorse['rank'];
    if (total >= 7) rank = 'S';
    else if (total >= 4) rank = 'A';
    else if (total >= 2) rank = 'B';
    else if (total >= 1) rank = 'C';
    else rank = '-';

    result.push({
      umaban,
      name: h.name,
      odds: h.tanshoOdds,
      statusJp: statusToJp(h.analysis.status),
      effRank: h.efficiency.rank,
      score: total,
      rank,
      modesCount: sc.modesCount,
      normalScore: sc.normal,
      uraScore: sc.ura,
      bousouScore: sc.bousou,
    });
  }

  result.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.modesCount !== a.modesCount) return b.modesCount - a.modesCount;
    return a.odds - b.odds;
  });

  return result;
}

// ===== ヘルパー =====

function getRankedUmabans(sh: ScoredHorse[], minRank: string): number[] {
  const rankOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1, '-': 0 };
  const minVal = rankOrder[minRank] ?? 0;
  return sh.filter(h => (rankOrder[h.rank] ?? 0) >= minVal).map(h => h.umaban);
}

function getTopN(sh: ScoredHorse[], n: number): number[] {
  return sh.slice(0, n).map(h => h.umaban);
}

// ===== 組み合わせ計算 =====

function countSanrenpuku(col1: number[], col2: number[], col3: number[]): number {
  const combos = new Set<string>();
  for (const a of col1) {
    for (const b of col2) {
      if (b === a) continue;
      for (const c of col3) {
        if (c === a || c === b) continue;
        combos.add([a, b, c].sort((x, y) => x - y).join(','));
      }
    }
  }
  return combos.size;
}

function countSanrentan(col1: number[], col2: number[], col3: number[]): number {
  let count = 0;
  for (const a of col1) {
    for (const b of col2) {
      if (b === a) continue;
      for (const c of col3) {
        if (c === a || c === b) continue;
        count++;
      }
    }
  }
  return count;
}

function listSanrenpukuCombos(col1: number[], col2: number[], col3: number[]): number[][] {
  const combos = new Set<string>();
  for (const a of col1) {
    for (const b of col2) {
      if (b === a) continue;
      for (const c of col3) {
        if (c === a || c === b) continue;
        combos.add([a, b, c].sort((x, y) => x - y).join(','));
      }
    }
  }
  return Array.from(combos).sort().map(s => s.split(',').map(Number));
}

// ===== 三連複パターン =====

function sanrenpukuHonsenA(sh: ScoredHorse[]): FormationPattern | null {
  const s = getRankedUmabans(sh, 'S');
  const a = getRankedUmabans(sh, 'A');
  const b = getRankedUmabans(sh, 'B');
  const col1 = s.length > 0 ? s.slice(0, 1) : a.slice(0, 1);
  const col2 = a.slice(0, 5);
  const col3 = b.slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '本線A（軸1頭固定）', emoji: '🎯',
    description: '3モード最高評価馬を1列目に固定した堅実型',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrenpukuHonsenB(sh: ScoredHorse[]): FormationPattern | null {
  const col1 = getTopN(sh, 2);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 5);
  const col3 = getRankedUmabans(sh, 'B').slice(0, 10);
  if (col1.length < 2 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '本線B（軸2頭広め）', emoji: '📋',
    description: '3モード上位2頭を1列目に入れた広めの型',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrenpuku2Jiku(sh: ScoredHorse[]): FormationPattern | null {
  const top = getTopN(sh, 2);
  if (top.length < 2) return null;
  const col3 = getRankedUmabans(sh, 'B').filter(u => !top.includes(u)).slice(0, 10);
  if (col3.length < 2) return null;
  const count = countSanrenpuku([top[0]], [top[1]], col3);
  return {
    name: '2頭軸流し', emoji: '🔒',
    description: '3モード上位2頭を固定し、相手に流す',
    col1: [top[0]], col2: [top[1]], col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrenpukuAna(sh: ScoredHorse[]): FormationPattern | null {
  const ana = sh
    .filter(h => (h.uraScore + h.bousouScore) >= 3 && h.odds >= 6.0)
    .sort((a, b) => (b.uraScore + b.bousouScore) - (a.uraScore + a.bousouScore));
  const col1 = ana.slice(0, 3).map(h => h.umaban);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 5);
  const col3 = getRankedUmabans(sh, 'B').slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '穴狙い', emoji: '💣',
    description: '裏・暴走モードで高評価の穴馬を1列目に据える',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrenpukuHimo(sh: ScoredHorse[]): FormationPattern | null {
  const col1 = getTopN(sh, 2);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 6);
  const col3 = getRankedUmabans(sh, 'C').slice(0, 12);
  if (col1.length < 1 || col2.length < 2 || col3.length < 3) return null;
  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '紐拡張（広め）', emoji: '🕸️',
    description: '3列目を広くして取りこぼし防止',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrenpukuEfficiency(sh: ScoredHorse[]): FormationPattern | null {
  const col1 = sh.filter(h => effScore(h.effRank) >= effScore('A') && h.score >= 2).slice(0, 3).map(h => h.umaban);
  const col2 = sh.filter(h => effScore(h.effRank) >= effScore('B+') && h.score >= 1).slice(0, 5).map(h => h.umaban);
  const col3 = getRankedUmabans(sh, 'C').slice(0, 10);
  if (col1.length < 1 || col2.length < 2 || col3.length < 3) return null;
  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '[AI] 効率重視', emoji: '🤖',
    description: '効率ランク×統合スコアで最適化。高回収率狙い',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

// ===== 三連単パターン =====

function sanrentanKenjitsu(sh: ScoredHorse[]): FormationPattern | null {
  const normalTop = [...sh].sort((a, b) => {
    if (b.normalScore !== a.normalScore) return b.normalScore - a.normalScore;
    return a.odds - b.odds;
  });
  let col1 = normalTop.filter(h => h.normalScore >= 3).slice(0, 2).map(h => h.umaban);
  if (col1.length === 0) col1 = getTopN(sh, 1);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 5);
  const col3 = getRankedUmabans(sh, 'B').slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrentan(col1, col2, col3);
  return {
    name: '堅実（鉄板が頭）', emoji: '🛡️',
    description: '通常モードで最も信頼される馬を1着に固定',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanGyakuten(sh: ScoredHorse[]): FormationPattern | null {
  const targetStatuses = ['ability', 'value', 'value_high', 'axis_value'];
  // Need to map statusJp back - but we can use the original status from horse.
  // Since we don't have raw status in ScoredHorse, we need to check statusJp
  const statusJpToStatus: Record<string, string> = {
    '実力': 'ability', '妙味': 'value', '激熱': 'value_high', '妙味軸': 'axis_value',
  };
  const col1 = sh
    .filter(h => {
      const rawStatus = Object.entries(statusJpToStatus).find(([jp]) => h.statusJp === jp)?.[1] ?? '';
      return targetStatuses.includes(rawStatus) && h.score >= 2;
    })
    .slice(0, 3)
    .map(h => h.umaban);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 5);
  const col3 = getRankedUmabans(sh, 'B').slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrentan(col1, col2, col3);
  return {
    name: '逆転（実力/妙味が頭）', emoji: '🔄',
    description: '実力馬・妙味馬が勝ち切るパターン',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanOana(sh: ScoredHorse[]): FormationPattern | null {
  const ana = sh
    .filter(h => (h.uraScore + h.bousouScore) >= 3 && h.odds >= 6.0)
    .sort((a, b) => (b.uraScore + b.bousouScore) - (a.uraScore + a.bousouScore));
  const col1 = ana.slice(0, 3).map(h => h.umaban);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 5);
  const col3 = getRankedUmabans(sh, 'B').slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 2) return null;
  const count = countSanrentan(col1, col2, col3);
  return {
    name: '大穴（激熱/妙味が頭）', emoji: '🔥',
    description: '裏・暴走で評価される穴馬が勝つ高配当型',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanUraomote(sh: ScoredHorse[]): FormationPattern | null {
  const top2 = getTopN(sh, 2);
  if (top2.length < 2) return null;
  const col3 = getRankedUmabans(sh, 'B').filter(u => !top2.includes(u)).slice(0, 6);
  if (col3.length < 2) return null;
  const count = countSanrentan(top2, top2, col3);
  return {
    name: '裏表（1-2着入れ替え）', emoji: '🔀',
    description: '3モード上位2頭の着順を両方カバー',
    col1: [...top2].sort((a, b) => a - b), col2: [...top2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanBox(sh: ScoredHorse[]): FormationPattern | null {
  const multi = sh
    .filter(h => h.modesCount >= 2 && h.score >= 3)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.modesCount - a.modesCount;
    });
  let box = multi.slice(0, 4).map(h => h.umaban);
  if (box.length < 3) {
    box = getTopN(sh.filter(h => h.score >= 2), Math.min(4, sh.filter(h => h.score >= 2).length));
  }
  if (box.length < 3) return null;
  const count = countSanrentan(box, box, box);
  return {
    name: `上位BOXマルチ（${box.length}頭）`, emoji: '📦',
    description: `3モード統合上位${box.length}頭の全順番カバー`,
    col1: [...box].sort((a, b) => a - b), col2: [...box].sort((a, b) => a - b), col3: [...box].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanSniper(sh: ScoredHorse[]): FormationPattern | null {
  const col1 = getTopN(sh, 1);
  const col2 = getRankedUmabans(sh, 'A').filter(u => !col1.includes(u)).slice(0, 5);
  const col3 = getRankedUmabans(sh, 'C').filter(u => !col1.includes(u)).slice(0, 10);
  if (col1.length === 0 || col2.length < 2 || col3.length < 3) return null;
  const count = countSanrentan(col1, col2, col3);
  return {
    name: '[AI] スナイパー', emoji: '🎯',
    description: '3モード最高評価馬を1着に絞り、2-3着を広げる',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

function sanrentanHoken(sh: ScoredHorse[]): FormationPattern | null {
  const col1 = getTopN(sh, 3);
  const col2 = getRankedUmabans(sh, 'A').slice(0, 6);
  const col3 = getRankedUmabans(sh, 'C').slice(0, 12);
  if (col1.length < 2 || col2.length < 3 || col3.length < 3) return null;
  const count = countSanrentan(col1, col2, col3);
  return {
    name: '[AI] 保険付き本線', emoji: '🛡️',
    description: '本線+各列を1段拡張し取りこぼし防止',
    col1: [...col1].sort((a, b) => a - b), col2: [...col2].sort((a, b) => a - b), col3: [...col3].sort((a, b) => a - b),
    count, amount: 0,
  };
}

// ===== 一撃パターン =====

/**
 * 一撃用: AI単勝/連対1-2位の馬番取得
 */
function getAiTop(horses: Horse[]): number[] {
  const result = new Set<number>();
  for (const h of horses) {
    const wr = h.predictions?.win_rate_rank ?? 99;
    const pr = h.predictions?.place_rate_rank ?? 99;
    if (wr <= 2 || pr <= 2) {
      result.add(h.number);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

/**
 * 一撃用: 各指標1位の馬番取得
 * AI単勝/AI連対/AI複勝/最終Sc/Mining/R評価/前走ZI/総合力 のいずれかで1位
 */
function getIndexTop1(horses: Horse[]): number[] {
  const result = new Set<number>();
  for (const h of horses) {
    // DEBUG: 各馬のランク1チェック
    const checks = {
      num: h.number,
      winRank: h.predictions.win_rate_rank,
      placeRank: h.predictions.place_rate_rank,
      showRank: h.predictions.show_rate_rank,
      finalRank: h.finalRank,
      miningRank: h.miningRank,
      raceEvalRank: h.raceEvalRank,
      ziRank: h.ziRank,
      powerRank: h.powerRank,
    };
    const hasRank1 = Object.entries(checks).some(([k, v]) => k !== 'num' && v === 1);
    if (hasRank1) {
      console.log('[getIndexTop1] rank1 found:', checks);
    }
    if (h.predictions.win_rate_rank === 1) result.add(h.number);
    if (h.predictions.place_rate_rank === 1) result.add(h.number);
    if (h.predictions.show_rate_rank === 1) result.add(h.number);
    if (h.finalRank === 1) result.add(h.number);
    if (h.miningRank === 1) result.add(h.number);
    if (h.raceEvalRank === 1) result.add(h.number);
    if (h.ziRank === 1) result.add(h.number);
    if (h.powerRank === 1) result.add(h.number);
  }
  console.log('[getIndexTop1] result:', Array.from(result));
  // 型チェック: ziRankが文字列になってないか確認
  for (const h of horses) {
    if (h.ziRank == 1) {  // == で緩い比較
      console.log(`[getIndexTop1] horse ${h.number} ziRank:`, h.ziRank, typeof h.ziRank, 'strict===1:', h.ziRank === 1);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}

/**
 * 一撃用: 2着昇格判定
 * 既存逆転の3着候補から以下のOR条件で2着に昇格:
 *   ① 効率S以上(7倍↑) & (AI予測5位以内 or FS48以上)
 *   ② score_rankingにいる(modesCount>=2 & score>=4)
 *   ③ 紐以上(status≠delete) & オッズ15倍以上
 */
function getIchigekiPromoted(
  col3Umabans: number[],
  horses: Horse[],
  sh: ScoredHorse[],
): number[] {
  const promoted = new Set<number>();
  const horseMap: Record<number, Horse> = {};
  for (const h of horses) horseMap[h.number] = h;

  for (const uma of col3Umabans) {
    const h = horseMap[uma];
    const s = sh.find(x => x.umaban === uma);
    if (!h || !s) continue;

    const odds = h.tanshoOdds ?? 0;
    const fs = h.indices?.final_score ?? 0;
    const aiWinRank = h.predictions?.win_rate_rank ?? 99;
    const aiPlaceRank = h.predictions?.place_rate_rank ?? 99;
    const aiShowRank = h.predictions?.show_rate_rank ?? 99;
    const ai5 = aiWinRank <= 5 || aiPlaceRank <= 5 || aiShowRank <= 5;

    // ① 効率S以上 & (AI5位以内 or FS48以上)
    if (odds >= 7.0 && (ai5 || fs >= 48)) {
      promoted.add(uma);
    }
    // ② score_ranking相当(3モードで複数回評価)
    if (s.modesCount >= 2 && s.score >= 4) {
      promoted.add(uma);
    }
    // ③ 紐以上(status≠delete) かつ オッズ15倍以上
    if (odds >= 15.0 && s.rank !== '-') {
      promoted.add(uma);
    }
  }

  return Array.from(promoted).sort((a, b) => a - b);
}

/**
 * 一撃（三連単）
 * 1着: 既存逆転1着 + AI単勝/連対1-2位 + 各指標1位
 * 2着: 既存逆転2着 + AI単勝/連対1-2位 + 昇格組
 * 3着: 総流し
 */
function sanrentanIchigeki(
  sh: ScoredHorse[],
  horses: Horse[],
  gyakutenPattern: FormationPattern | null,
): FormationPattern | null {
  if (!gyakutenPattern) return null;

  const aiTop = getAiTop(horses);
  const indexTop1 = getIndexTop1(horses);
  const allUma = horses.map(h => h.number).sort((a, b) => a - b);

  const col1 = Array.from(new Set([...gyakutenPattern.col1, ...aiTop, ...indexTop1])).sort((a, b) => a - b);
  const promoted = getIchigekiPromoted(gyakutenPattern.col3, horses, sh);
  const col2 = Array.from(new Set([...gyakutenPattern.col2, ...aiTop, ...promoted])).sort((a, b) => a - b);
  const col3 = allUma;

  if (col1.length === 0 || col2.length < 2) return null;

  const count = countSanrentan(col1, col2, col3);
  return {
    name: '一撃（三連単）', emoji: '⚡',
    description: '逆転強化+各指標1位+3着総流し',
    col1, col2, col3,
    count, amount: 0,
  };
}

/**
 * 一撃（三連複）
 * 1列目: 既存逆転1着 + AI単勝/連対1-2位 + 各指標1位
 * 2列目: 既存逆転2着 + AI単勝/連対1-2位 + 昇格組
 * 3列目: 総流し
 */
function sanrenpukuIchigeki(
  sh: ScoredHorse[],
  horses: Horse[],
  gyakutenPattern: FormationPattern | null,
): FormationPattern | null {
  if (!gyakutenPattern) return null;

  const aiTop = getAiTop(horses);
  const indexTop1 = getIndexTop1(horses);
  const allUma = horses.map(h => h.number).sort((a, b) => a - b);

  const col1 = Array.from(new Set([...gyakutenPattern.col1, ...aiTop, ...indexTop1])).sort((a, b) => a - b);
  const promoted = getIchigekiPromoted(gyakutenPattern.col3, horses, sh);
  const col2 = Array.from(new Set([...gyakutenPattern.col2, ...aiTop, ...promoted])).sort((a, b) => a - b);
  const col3 = allUma;

  if (col1.length === 0 || col2.length < 2) return null;

  const count = countSanrenpuku(col1, col2, col3);
  return {
    name: '一撃（三連複）', emoji: '⚡',
    description: '逆転強化+各指標1位+3列目総流し',
    col1, col2, col3,
    count, amount: 0,
  };
}

// ===== メイン =====

export function generateFormations(
  horses: Horse[],
  modeBets: Record<string, Bet[]>,
  unitAmount: number = 100,
): FormationResult {
  if (horses.length < 5) {
    return { sanrenpuku: [], sanrentan: [], scoredHorses: [] };
  }

  let sh = buildIntegratedScores(horses, modeBets);

  // スコア全0（モードデータなし）→ ステータスベースフォールバック
  const maxScore = Math.max(...sh.map(h => h.score), 0);
  if (maxScore === 0) {
    const statusScores: Record<string, number> = {
      '鉄板': 8, '有力軸': 7, '激熱': 6, '妙味軸': 5,
      '実力': 4, '妙味': 3, '紐': 2, '消': 0,
    };
    sh = sh.map(h => {
      const score = statusScores[h.statusJp] ?? 0;
      let rank: ScoredHorse['rank'];
      if (score >= 7) rank = 'S';
      else if (score >= 4) rank = 'A';
      else if (score >= 2) rank = 'B';
      else if (score >= 1) rank = 'C';
      else rank = '-';
      return { ...h, score, rank };
    });
    sh.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.odds - b.odds;
    });
  }

  // 三連複
  const spGenerators = [
    sanrenpukuHonsenA, sanrenpukuHonsenB, sanrenpuku2Jiku,
    sanrenpukuAna, sanrenpukuHimo, sanrenpukuEfficiency,
  ];
  const sanrenpuku: FormationPattern[] = [];
  for (const gen of spGenerators) {
    const r = gen(sh);
    if (r) {
      r.amount = r.count * unitAmount;
      r.combos = listSanrenpukuCombos(r.col1, r.col2, r.col3);
      sanrenpuku.push(r);
    }
  }

  // 三連単
  const stGenerators = [
    sanrentanKenjitsu, sanrentanGyakuten, sanrentanOana,
    sanrentanUraomote, sanrentanBox, sanrentanSniper, sanrentanHoken,
  ];
  const sanrentan: FormationPattern[] = [];
  for (const gen of stGenerators) {
    const r = gen(sh);
    if (r) {
      r.amount = r.count * unitAmount;
      sanrentan.push(r);
    }
  }

  // 一撃パターン（逆転ベースの強化版）
  const gyakutenPattern = sanrentanGyakuten(sh);
  const ichigekiSt = sanrentanIchigeki(sh, horses, gyakutenPattern);
  if (ichigekiSt) {
    ichigekiSt.amount = ichigekiSt.count * unitAmount;
    sanrentan.push(ichigekiSt);
  }
  const ichigekiSp = sanrenpukuIchigeki(sh, horses, gyakutenPattern);
  if (ichigekiSp) {
    ichigekiSp.amount = ichigekiSp.count * unitAmount;
    ichigekiSp.combos = listSanrenpukuCombos(ichigekiSp.col1, ichigekiSp.col2, ichigekiSp.col3);
    sanrenpuku.push(ichigekiSp);
  }

  const scoredHorses = sh.filter(h => h.score > 0);

  return { sanrenpuku, sanrentan, scoredHorses };
}
