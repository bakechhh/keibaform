import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Race,
  Horse,
  OddsDisplay,
  PastRace,
  RawRaceData,
  RawOddsEntry,
  RawRaceResult,
  RawPastRace,
  RaceResultDisplay,
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

// 馬番を数値に変換するヘルパー
function parseHorseNum(num: number | string): number {
  return typeof num === 'string' ? parseInt(num, 10) : num;
}

// 過去レースを変換するヘルパー
function transformPastRaces(rawPastRaces?: RawPastRace[]): PastRace[] {
  if (!rawPastRaces || rawPastRaces.length === 0) {
    return [];
  }
  return rawPastRaces.map(pr => ({
    date: pr.date,
    raceName: pr.race_name,
    position: pr.rank,
    place: pr.place,
    distance: parseInt(pr.distance, 10) || 0,
    surface: pr.surface,
    condition: pr.track_condition,
    runningStyle: pr.running_style,
    last3f: pr.last_3f,
    ave3f: pr.ave_3f,
    margin: pr.margin,
    correctedTime: pr.corrected_time,
    pci: pr.pci,
    frame: parseInt(pr.frame, 10) || 0,
    horseNumber: parseInt(pr.horse_number, 10) || 0,
    weight: pr.weight,
    weightReduction: pr.weight_reduction,
    position3f: pr.position_3f,
  }));
}

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
        tanshoOddsMap.set(parseHorseNum(t.horse_num), t.odds);
      });
    }
    if (tfwOdds?.data.fukusho) {
      tfwOdds.data.fukusho.forEach(f => {
        fukushoOddsMap.set(parseHorseNum(f.horse_num), f.odds);
      });
    }
  }

  // 単勝オッズから人気を計算（オッズ昇順でソート→順位が人気）
  const popularityMap = new Map<number, number>();
  const sortedOdds = Array.from(tanshoOddsMap.entries()).sort((a, b) => a[1] - b[1]);
  sortedOdds.forEach(([horseNum], index) => {
    popularityMap.set(horseNum, index + 1); // 1人気から始まる
  });

  // RawHorseをHorseWithRanksに変換（人気を設定）
  const horsesWithRanks: HorseWithRanks[] = rawRace.horses.map(h => ({
    ...h,
    // 人気はオッズから計算、なければ生データの値を使用
    popularity: popularityMap.get(h.horse_number) ?? h.popularity ?? 99,
  }));

  // 競馬脳ロジックでレース分析を実行
  const { horses: analyzedHorses, evaluation } = analyzeRace(horsesWithRanks, tanshoOddsMap);

  // 馬データをUI用に変換
  const horses: Horse[] = analyzedHorses.map((h: HorseWithRanks) => {
    const fukushoOdds = fukushoOddsMap.get(h.horse_number) || { min: 1.0, max: 1.0 };
    const stats = convertToStats(h);
    const overallRating = calculateOverallRating(h, h.powerRank ?? 99, rawRace.horses.length);

    // jockeyがオブジェクトか文字列かを判定
    const jockeyName = typeof h.jockey === 'object' && h.jockey !== null
      ? h.jockey.name
      : (h.jockey || '未定');

    return {
      id: `${rawRace.race_id}-${h.horse_number}`,
      name: h.horse_name,
      number: h.horse_number,
      jockey: jockeyName,
      popularity: h.popularity ?? 99,
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
      pastRaces: transformPastRaces(h.past_races),
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
    originalRaceId: rawRace.race_id, // オッズ検索用の元のrace_id
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
    wakuren: [],
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
            horseNum: parseHorseNum(t.horse_num),
            horseName: t.horse_name,
            odds: t.odds,
          }));
        }
        if (entry.data.fukusho) {
          result.fukusho = entry.data.fukusho.map(f => ({
            horseNum: parseHorseNum(f.horse_num),
            horseName: f.horse_name,
            min: f.odds.min,
            max: f.odds.max,
          }));
        }
        break;
      case 'wakuren':
        if (entry.data.combinations) {
          result.wakuren = entry.data.combinations.map(c => ({
            combination: c.combination,
            odds: typeof c.odds === 'number' ? c.odds : c.odds.min,
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

// レース結果データを表示用に変換
function transformRaceResultData(rawResult: RawRaceResult): RaceResultDisplay {
  const payouts: RaceResultDisplay['payouts'] = {};

  // 払戻データの変換
  if (rawResult.払戻) {
    if (rawResult.払戻.単勝) {
      payouts.tansho = rawResult.払戻.単勝.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻.複勝) {
      payouts.fukusho = rawResult.払戻.複勝.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻.枠連) {
      payouts.wakuren = rawResult.払戻.枠連.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻.馬連) {
      payouts.umaren = rawResult.払戻.馬連.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻.馬単) {
      payouts.umatan = rawResult.払戻.馬単.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻.ワイド) {
      payouts.wide = rawResult.払戻.ワイド.map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻['3連複']) {
      payouts.sanrenpuku = rawResult.払戻['3連複'].map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
    if (rawResult.払戻['3連単']) {
      payouts.sanrentan = rawResult.払戻['3連単'].map(p => ({
        combination: p.組み合わせ,
        payout: parseInt(p.払出, 10),
      }));
    }
  }

  // 着順データの変換
  const finishOrder = rawResult.着順?.map(f => ({
    position: parseInt(f.着順, 10),
    horseName: f.馬名,
    horseNum: parseInt(f.馬番, 10),
  })) || [];

  return {
    date: rawResult.date,
    payouts,
    finishOrder,
  };
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

      // レースデータ、オッズデータ、馬場状態、レース結果を並列取得
      const [raceResult, oddsResult, trackResult, resultsResult] = await Promise.all([
        supabase.from('race_data_json').select('race_id, data'),
        supabase.from('race_odds_json').select('race_id, data'),
        supabase.from('track_conditions').select('race_id, track_condition'),
        supabase.from('race_results').select('race_id, data'),
      ]);

      if (raceResult.error) throw raceResult.error;
      if (oddsResult.error) {
        console.warn('オッズデータ取得エラー:', oddsResult.error);
      }
      // 馬場状態とレース結果はオプショナルなのでエラーは警告のみ
      if (trackResult.error) {
        console.warn('馬場状態データ取得エラー:', trackResult.error);
      }
      if (resultsResult.error) {
        console.warn('レース結果データ取得エラー:', resultsResult.error);
      }

      // オッズをマップに変換
      const oddsMap = new Map<string, RawOddsEntry[]>();
      for (const row of oddsResult.data || []) {
        oddsMap.set(row.race_id, row.data as RawOddsEntry[]);
      }

      // 馬場状態をマップに変換
      const trackConditionMap = new Map<string, string>();
      for (const row of trackResult.data || []) {
        trackConditionMap.set(row.race_id, row.track_condition);
      }

      // レース結果をマップに変換
      const raceResultsMap = new Map<string, RawRaceResult>();
      for (const row of resultsResult.data || []) {
        // dataがJSON文字列の場合はパース
        const resultData = typeof row.data === 'string'
          ? JSON.parse(row.data) as RawRaceResult
          : row.data as RawRaceResult;
        raceResultsMap.set(row.race_id, resultData);
      }

      // レースデータを変換
      const transformedRaces: Race[] = [];
      let raceIndex = 0;
      for (const row of raceResult.data || []) {
        const rawRace = row.data as RawRaceData;
        const odds = oddsMap.get(row.race_id) || null;
        const trackCondition = trackConditionMap.get(row.race_id);
        const raceResultData = raceResultsMap.get(row.race_id);

        const race = transformRaceData(rawRace, odds);
        // race_idが重複する可能性があるため、インデックスを追加してユニークにする
        race.id = `${row.race_id}-${raceIndex}`;
        // オッズ検索用にデータベースカラムのrace_idを使用（JSON内のrace_idとは異なる場合がある）
        race.originalRaceId = row.race_id;
        raceIndex++;

        // 馬場状態を設定
        if (trackCondition) {
          race.trackCondition = trackCondition;
        }

        // レース結果を設定
        if (raceResultData) {
          race.result = transformRaceResultData(raceResultData);
        }

        transformedRaces.push(race);
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
