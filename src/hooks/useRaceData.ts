import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Race,
  Horse,
  OddsDisplay,
  RawRaceData,
  RawOddsEntry,
} from '../types';
import {
  getHorseColor,
  analyzeRace,
  convertToStats,
  calculateOverallRating,
  HorseWithRanks,
} from '../lib/racing-logic';

// キャッシュ
let cachedRaces: Race[] | null = null;
let cacheDate: string | null = null;

// 生データを表示用に変換
function transformRaceData(
  rawRace: RawRaceData,
  oddsData: RawOddsEntry[] | null
): Race {
  // オッズデータから単勝・複勝オッズを取得
  const tanshoOddsMap = new Map<number, number>();
  const fukushoOddsMap = new Map<number, { min: number; max: number }>();

  if (oddsData) {
    const tfwOdds = oddsData.find(o => o.odds_type === 'tfw');
    if (tfwOdds?.data.tansho) {
      tfwOdds.data.tansho.forEach(t => {
        tanshoOddsMap.set(t.horse_num, t.odds);
      });
    }
    if (tfwOdds?.data.fukusho) {
      tfwOdds.data.fukusho.forEach(f => {
        fukushoOddsMap.set(f.horse_num, f.odds);
      });
    }
  }

  // RawHorseをHorseWithRanksに変換
  const horsesWithRanks: HorseWithRanks[] = rawRace.horses.map(h => ({
    ...h,
  }));

  // 競馬脳ロジックでレース分析を実行
  const { horses: analyzedHorses, evaluation } = analyzeRace(horsesWithRanks, tanshoOddsMap);

  // 馬データをUI用に変換
  const horses: Horse[] = analyzedHorses.map((h: HorseWithRanks) => {
    const fukushoOdds = fukushoOddsMap.get(h.horse_number) || { min: 1.0, max: 1.0 };
    const stats = convertToStats(h);
    const overallRating = calculateOverallRating(h, h.powerRank ?? 99, rawRace.horses.length);

    return {
      id: `${rawRace.race_id}-${h.horse_number}`,
      name: h.horse_name,
      number: h.horse_number,
      jockey: h.jockey || '未定',
      popularity: h.popularity,
      color: getHorseColor(h.horse_number),
      predictions: h.predictions,
      indices: h.indices,
      miningRank: h.miningRank ?? 99,
      raceEvalRank: h.raceEvalRank ?? 99,
      ziRank: h.ziRank ?? 99,
      baseRank: h.baseRank ?? 99,
      finalRank: h.finalRank ?? 99,
      stats,
      tanshoOdds: h.tanshoOdds ?? 99.9,
      fukushoOdds,
      powerScore: h.powerScore ?? 0,
      powerRank: h.powerRank ?? 99,
      efficiency: h.efficiency!,
      analysis: h.analysis!,
      overallRating,
      winRate: Math.round(h.predictions.win_rate * 100),
      placeRate: Math.round(h.predictions.place_rate * 100),
      pastRaces: [],
    };
  });

  // グレード推定（レース名から）
  let grade = 'OP';
  const raceName = rawRace.race_name || '';
  if (raceName.includes('G1') || raceName.includes('GI')) {
    grade = 'G1';
  } else if (raceName.includes('G2') || raceName.includes('GII')) {
    grade = 'G2';
  } else if (raceName.includes('G3') || raceName.includes('GIII')) {
    grade = 'G3';
  } else if (raceName.includes('新馬')) {
    grade = '新馬';
  } else if (raceName.includes('未勝利')) {
    grade = '未勝利';
  } else if (raceName.includes('1勝')) {
    grade = '1勝';
  } else if (raceName.includes('2勝')) {
    grade = '2勝';
  } else if (raceName.includes('3勝')) {
    grade = '3勝';
  }

  return {
    id: rawRace.race_id,
    name: rawRace.race_name || `${rawRace.place}${rawRace.round}R`,
    date: new Date().toISOString().split('T')[0],
    location: rawRace.place,
    round: rawRace.round,
    distance: rawRace.distance,
    surface: rawRace.surface,
    condition: rawRace.condition,
    grade,
    horses,
    evaluation,
  };
}

// オッズデータを表示用に変換
function transformOddsData(oddsData: RawOddsEntry[]): OddsDisplay {
  const result: OddsDisplay = {
    tansho: [],
    fukusho: [],
    umaren: [],
    wide: [],
    umatan: [],
    sanrenpuku: [],
    sanrentan: [],
  };

  for (const entry of oddsData) {
    switch (entry.odds_type) {
      case 'tfw':
        if (entry.data.tansho) {
          result.tansho = entry.data.tansho.map(t => ({
            horseNum: t.horse_num,
            horseName: t.horse_name,
            odds: t.odds,
          }));
        }
        if (entry.data.fukusho) {
          result.fukusho = entry.data.fukusho.map(f => ({
            horseNum: f.horse_num,
            horseName: f.horse_name,
            min: f.odds.min,
            max: f.odds.max,
          }));
        }
        break;
      case 'umaren':
        if (entry.data.combinations) {
          result.umaren = entry.data.combinations.map(c => ({
            combination: c.combination,
            odds: typeof c.odds === 'number' ? c.odds : c.odds.min,
          }));
        }
        break;
      case 'wide':
        if (entry.data.combinations) {
          result.wide = entry.data.combinations.map(c => ({
            combination: c.combination,
            min: typeof c.odds === 'number' ? c.odds : c.odds.min,
            max: typeof c.odds === 'number' ? c.odds : c.odds.max,
          }));
        }
        break;
      case 'umatan':
        if (entry.data.combinations) {
          result.umatan = entry.data.combinations.map(c => ({
            combination: c.combination,
            odds: typeof c.odds === 'number' ? c.odds : c.odds.min,
          }));
        }
        break;
      case 'sanrenpuku':
        if (entry.data.combinations) {
          result.sanrenpuku = entry.data.combinations.map(c => ({
            combination: c.combination,
            odds: typeof c.odds === 'number' ? c.odds : c.odds.min,
          }));
        }
        break;
      case 'sanrentan':
        if (entry.data.combinations) {
          result.sanrentan = entry.data.combinations.map(c => ({
            combination: c.combination,
            odds: typeof c.odds === 'number' ? c.odds : c.odds.min,
          }));
        }
        break;
    }
  }

  return result;
}

export function useRaceData() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRaces = useCallback(async (forceRefresh = false) => {
    // Supabaseが設定されていない場合はモックデータを使用
    if (!supabase) {
      const { mockRaces } = await import('../mockData');
      setRaces(mockRaces);
      setLoading(false);
      return;
    }

    // キャッシュチェック
    const today = new Date().toISOString().split('T')[0];
    if (!forceRefresh && cachedRaces && cacheDate === today) {
      setRaces(cachedRaces);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // レースデータとオッズデータを並列取得
      const [raceResult, oddsResult] = await Promise.all([
        supabase.from('race_data_json').select('race_id, data'),
        supabase.from('race_odds_json').select('race_id, data'),
      ]);

      if (raceResult.error) throw raceResult.error;
      if (oddsResult.error) throw oddsResult.error;

      // オッズをマップに変換
      const oddsMap = new Map<string, RawOddsEntry[]>();
      for (const row of oddsResult.data || []) {
        oddsMap.set(row.race_id, row.data as RawOddsEntry[]);
      }

      // レースデータを変換
      const transformedRaces: Race[] = [];
      for (const row of raceResult.data || []) {
        const rawRace = row.data as RawRaceData;
        const odds = oddsMap.get(row.race_id) || null;
        transformedRaces.push(transformRaceData(rawRace, odds));
      }

      // 場所→ラウンド順でソート
      transformedRaces.sort((a, b) => {
        if (a.location !== b.location) {
          return a.location.localeCompare(b.location);
        }
        return a.round - b.round;
      });

      // キャッシュ更新
      cachedRaces = transformedRaces;
      cacheDate = today;

      setRaces(transformedRaces);
    } catch (err) {
      console.error('Failed to load race data:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');

      // エラー時はモックデータにフォールバック
      const { mockRaces } = await import('../mockData');
      setRaces(mockRaces);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    loadRaces(true);
  }, [loadRaces]);

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  return { races, loading, error, refreshData };
}

export function useOddsData(raceId: string | null) {
  const [odds, setOdds] = useState<OddsDisplay | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!raceId || !supabase) {
      setOdds(null);
      return;
    }

    const loadOdds = async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('race_odds_json')
          .select('data')
          .eq('race_id', raceId)
          .maybeSingle();

        if (error) throw error;
        if (data?.data) {
          setOdds(transformOddsData(data.data as RawOddsEntry[]));
        }
      } catch (err) {
        console.error('Failed to load odds:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOdds();
  }, [raceId]);

  return { odds, loading };
}
