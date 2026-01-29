import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RaceResult, RaceResultData } from '../types/raceResults';

interface UseRaceResultsReturn {
  results: RaceResult[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getResultByRaceId: (raceId: string) => RaceResult | undefined;
  getResultByVenueRound: (venue: string, round: number) => RaceResult | undefined;
}

export function useRaceResults(date?: string): UseRaceResultsReturn {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!supabase) {
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('race_results')
        .select('race_id, data, created_at')
        .order('created_at', { ascending: true });

      // 日付でフィルター（date が指定されている場合）
      if (date) {
        // data->>date でJSONBの中のdateフィールドをフィルター
        query = query.filter('data->>date', 'eq', date);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const formattedResults: RaceResult[] = data.map((row) => ({
          race_id: row.race_id,
          data: row.data as RaceResultData,
          created_at: row.created_at,
        }));
        setResults(formattedResults);
      }
    } catch (err) {
      console.error('Failed to fetch race results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // リアルタイム更新のサブスクリプション
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('race_results_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'race_results',
        },
        (payload) => {
          const newResult: RaceResult = {
            race_id: payload.new.race_id,
            data: payload.new.data as RaceResultData,
            created_at: payload.new.created_at,
          };

          // 日付フィルターがある場合はチェック
          if (date && newResult.data.date !== date) {
            return;
          }

          setResults((prev) => {
            // 既存のrace_idがあれば更新、なければ追加
            const existingIndex = prev.findIndex(r => r.race_id === newResult.race_id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newResult;
              return updated;
            }
            return [...prev, newResult];
          });
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [date]);

  const getResultByRaceId = useCallback((raceId: string) => {
    // race_idから開催場所とレース番号を抽出
    // 形式: "京都2R-0" や "中山1R" など（末尾に-indexがつく場合がある）
    const match = raceId.match(/^(.+?)(\d+)R/);
    if (!match) return undefined;

    const [, venue, roundStr] = match;
    const round = parseInt(roundStr, 10);

    return results.find(r =>
      r.data.開催場所 === venue && r.data.レース番号 === round
    );
  }, [results]);

  // 開催場所とラウンドで直接検索
  const getResultByVenueRound = useCallback((venue: string, round: number) => {
    return results.find(r =>
      r.data.開催場所 === venue && r.data.レース番号 === round
    );
  }, [results]);

  return {
    results,
    loading,
    error,
    refetch: fetchResults,
    getResultByRaceId,
    getResultByVenueRound,
  };
}
