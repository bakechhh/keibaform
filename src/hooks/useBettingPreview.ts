/**
 * 馬券プレビュー計算オーケストレーター
 */

import { useMemo, useState } from 'react';
import { Race, OddsDisplay, CompareResult, FormationResult, BettingConfig, Bet } from '../types';
import {
  generateRaceBets,
  generateRaceBetsUra,
  generateRaceBetsBousou,
  buildWideOddsMap,
  buildUmarenOddsMap,
  DEFAULT_TANSHO_AMOUNT,
  DEFAULT_WIDE_AMOUNT,
  DEFAULT_UMAREN_AMOUNT,
} from '../lib/bet-generator';
import { generateFormations } from '../lib/formation-generator';

export function useBettingPreview(race: Race | null, odds: OddsDisplay | null) {
  const [config, setConfig] = useState<BettingConfig>({
    tanshoAmount: DEFAULT_TANSHO_AMOUNT,
    wideAmount: DEFAULT_WIDE_AMOUNT,
    umarenAmount: DEFAULT_UMAREN_AMOUNT,
    skipLowOdds: false,
  });

  const wideOddsMap = useMemo(() => buildWideOddsMap(odds), [odds]);
  const umarenOddsMap = useMemo(() => buildUmarenOddsMap(odds), [odds]);

  const compareResult = useMemo<CompareResult | null>(() => {
    if (!race || race.horses.length === 0) return null;

    const horses = race.horses;

    const normal = generateRaceBets(
      race, horses, wideOddsMap, umarenOddsMap,
      config.tanshoAmount, config.wideAmount, config.umarenAmount,
    );
    const ura = generateRaceBetsUra(
      race, horses, wideOddsMap, umarenOddsMap,
      config.tanshoAmount, config.wideAmount, config.umarenAmount,
    );
    const bousou = generateRaceBetsBousou(
      race, horses, wideOddsMap, umarenOddsMap,
      config.wideAmount, config.umarenAmount,
    );

    return { normal, ura, bousou };
  }, [race, wideOddsMap, umarenOddsMap, config]);

  const formationResult = useMemo<FormationResult | null>(() => {
    if (!race || !compareResult) return null;

    const modeBets: Record<string, Bet[]> = {};
    if (compareResult.normal) modeBets.normal = compareResult.normal.bets;
    if (compareResult.ura) modeBets.ura = compareResult.ura.bets;
    if (compareResult.bousou) modeBets.bousou = compareResult.bousou.bets;

    return generateFormations(race.horses, modeBets);
  }, [race, compareResult]);

  return {
    config,
    setConfig,
    compareResult,
    formationResult,
  };
}
