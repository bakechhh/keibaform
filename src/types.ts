// ===== Supabaseから取得する生データの型 =====

export interface RawPredictions {
  win_rate: number;
  place_rate: number;
  show_rate: number;
  win_rate_rank: number;
  place_rate_rank: number;
  show_rate_rank: number;
}

export interface RawIndices {
  final_score: number;
  mining_index: number;
  corrected_time_deviation: number;
  zi_deviation: number;
  base_score: number;
}

export interface RawHorse {
  horse_number: number;
  horse_name: string;
  jockey?: string;
  popularity: number;
  predictions: RawPredictions;
  indices: RawIndices;
}

export interface RawRaceData {
  race_id: string;
  race_number: string;
  race_name: string;
  place: string;
  round: number;
  surface: '芝' | 'ダ';
  distance: number;
  condition: string;
  horses: RawHorse[];
}

export interface RawTanshoOdds {
  horse_num: number;
  horse_name: string;
  odds: number;
}

export interface RawFukushoOdds {
  horse_num: number;
  horse_name: string;
  odds: { min: number; max: number };
}

export interface RawCombinationOdds {
  combination: string;
  odds: number | { min: number; max: number };
}

export interface RawOddsEntry {
  odds_type: 'tfw' | 'wakuren' | 'umaren' | 'wide' | 'umatan' | 'sanrenpuku' | 'sanrentan';
  odds_type_name: string;
  data: {
    tansho?: RawTanshoOdds[];
    fukusho?: RawFukushoOdds[];
    combinations?: RawCombinationOdds[];
  };
}

// ===== UI表示用ステータス =====

export interface HorseStats {
  speed: number;      // win_rate × 100
  stamina: number;    // place_rate × 100
  power: number;      // final_score
  guts: number;       // mining_index
  intelligence: number; // base_score
  technique: number;  // 補正タイム偏差を正規化
}

export interface EfficiencyRank {
  rank: 'SS' | 'S' | 'A' | 'B' | 'C';
  label: string;
  returnRate: number;
  color: string;
}

// racing-logic.tsからインポートして使う
export type { Badge, HorseAnalysis, RaceEvaluation, HorseWithRanks } from './lib/racing-logic';

export interface PastRace {
  date: string;
  raceName: string;
  position: number;
  time: string;
  distance: number;
  condition: string;
}

export interface Horse {
  id: string;
  name: string;
  number: number;
  jockey: string;
  popularity: number;
  color: string;

  // AI予測
  predictions: RawPredictions;

  // 各種指数
  indices: RawIndices;

  // ランク情報
  miningRank: number;
  raceEvalRank: number;
  ziRank: number;
  baseRank: number;
  finalRank: number;

  // 表示用に変換したステータス
  stats: HorseStats;

  // オッズ情報
  tanshoOdds: number;
  fukushoOdds: { min: number; max: number };

  // 計算済みランキング
  powerScore: number;
  powerRank: number;
  efficiency: EfficiencyRank;

  // 分析結果（完全版）
  analysis: {
    status: 'axis_iron' | 'axis_strong' | 'axis_value' | 'value_high' | 'value' | 'ability' | 'safe' | 'delete';
    isBuy: boolean;
    badges: Array<{
      text: string;
      type: string;
      style: 'main' | 'gap' | 'rank';
      val: string;
    }>;
  };

  // 総合評価（表示用）
  overallRating: number;
  winRate: number;
  placeRate: number;

  // 過去レース（あれば）
  pastRaces: PastRace[];
}

export interface Race {
  id: string;
  name: string;
  date: string;
  location: string;
  round: number;
  distance: number;
  surface: '芝' | 'ダ';
  condition: string;
  grade: string;
  horses: Horse[];

  // レース評価（完全版）
  evaluation: {
    type: 'SUPER' | 'GOOD' | 'SOLID' | 'CHAOS' | 'NORMAL' | 'KEN';
    label: string;
    color: string;
    bg: string;
    description: string;
  };
}

// ===== オッズ表示用 =====

export interface OddsDisplay {
  tansho: { horseNum: number; horseName: string; odds: number }[];
  fukusho: { horseNum: number; horseName: string; min: number; max: number }[];
  umaren: { combination: string; odds: number }[];
  wide: { combination: string; min: number; max: number }[];
  umatan: { combination: string; odds: number }[];
  sanrenpuku: { combination: string; odds: number }[];
  sanrentan: { combination: string; odds: number }[];
}
