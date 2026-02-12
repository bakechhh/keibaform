/**
 * 合成オッズ計算ユーティリティ
 * BettingPreviewView + ichigeki-checker の両方で使う共通ロジック
 */

import { FormationPattern, OddsDisplay } from '../types';

export function buildSanrenpukuOddsMap(odds: OddsDisplay | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!odds) return map;
  for (const entry of odds.sanrenpuku) {
    const nums = entry.combination.split(/[-=]/).map(Number).sort((a, b) => a - b);
    if (nums.length === 3) {
      map.set(nums.join('-'), entry.odds);
    }
  }
  return map;
}

export function buildSanrentanOddsMap(odds: OddsDisplay | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!odds) return map;
  for (const entry of odds.sanrentan) {
    map.set(entry.combination, entry.odds);
  }
  return map;
}

export function calcFormationSyntheticOdds(
  pattern: FormationPattern,
  type: '三連複' | '三連単',
  spOddsMap: Map<string, number>,
  stOddsMap: Map<string, number>,
): number | null {
  if (type === '三連複') {
    const combos = pattern.combos;
    if (!combos || combos.length === 0) return null;
    let sum = 0;
    let found = 0;
    for (const combo of combos) {
      const key = [...combo].sort((a, b) => a - b).join('-');
      const odds = spOddsMap.get(key);
      if (odds && odds > 0) {
        sum += 1 / odds;
        found++;
      }
    }
    if (found === 0) return null;
    return 1 / sum;
  } else {
    let sum = 0;
    let found = 0;
    for (const a of pattern.col1) {
      for (const b of pattern.col2) {
        if (b === a) continue;
        for (const c of pattern.col3) {
          if (c === a || c === b) continue;
          const key = `${a}-${b}-${c}`;
          const odds = stOddsMap.get(key);
          if (odds && odds > 0) {
            sum += 1 / odds;
            found++;
          }
        }
      }
    }
    if (found === 0) return null;
    return 1 / sum;
  }
}
