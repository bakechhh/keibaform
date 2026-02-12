/**
 * 全レース一撃スキャン
 * quickCheck通過レースに対し、オッズ+フォーメーション計算して完全判定
 */

import { useMemo } from 'react';
import { Race, OddsDisplay, Bet } from '../types';
import {
  generateRaceBets,
  generateRaceBetsUra,
  generateRaceBetsBousou,
  buildWideOddsMap,
  buildUmarenOddsMap,
} from '../lib/bet-generator';
import { generateFormations } from '../lib/formation-generator';
import {
  quickCheckIchigeki,
  checkIchigekiEligibility,
  IchigekiEligibility,
  IchigekiLevel,
} from '../lib/ichigeki-checker';

export interface IchigekiScanResult {
  race: Race;
  level: IchigekiLevel;
  eligibility: IchigekiEligibility;
}

export function useIchigekiScan(
  races: Race[],
  allOddsMap: Map<string, OddsDisplay>,
) {
  return useMemo(() => {
    const results: IchigekiScanResult[] = [];

    for (const race of races) {
      // クイックチェック（オッズ不要4条件）でまず絞り込み
      const quick = quickCheckIchigeki(race);
      if (!quick.candidate) continue;

      // オッズ取得
      const odds = allOddsMap.get(race.originalRaceId) ?? null;
      if (!odds) continue;

      // フォーメーション生成に必要な3モード計算
      const wideOddsMap = buildWideOddsMap(odds);
      const umarenOddsMap = buildUmarenOddsMap(odds);
      const horses = race.horses;

      const normal = generateRaceBets(race, horses, wideOddsMap, umarenOddsMap, 100, 100, 100);
      const ura = generateRaceBetsUra(race, horses, wideOddsMap, umarenOddsMap, 100, 100, 100);
      const bousou = generateRaceBetsBousou(race, horses, wideOddsMap, umarenOddsMap, 100, 100);

      const modeBets: Record<string, Bet[]> = {};
      if (normal) modeBets.normal = normal.bets;
      if (ura) modeBets.ura = ura.bets;
      if (bousou) modeBets.bousou = bousou.bets;

      const formationResult = generateFormations(horses, modeBets);
      const eligibility = checkIchigekiEligibility(race, odds, formationResult);

      if (eligibility.level !== 'ineligible') {
        results.push({ race, level: eligibility.level, eligibility });
      }
    }

    return results;
  }, [races, allOddsMap]);
}
