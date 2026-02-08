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

export interface JockeyStats {
  wins: number;
  win_rate: number;
  place_rate: number;
  show_rate: number;
}

export interface RawJockey {
  name: string;
  weight: number;
  last_year: JockeyStats;
  this_year: JockeyStats;
  weight_reduction?: string;
}

export interface RawPastRace {
  pci: number;
  date: string;
  rank: string;
  frame: string;
  place: string;
  ave_3f: number;
  margin: number;
  weight: number;
  last_3f: number;
  surface: string;
  distance: string;
  race_name: string;
  position_3f: number;
  horse_number: string;
  running_style: string;
  corrected_time: number;
  track_condition: string;
  weight_reduction: string;
}

export interface RawTrainer {
  name: string;
  affiliation: string;
  last_year: JockeyStats;
  this_year: JockeyStats;
}

export interface RawHorse {
  horse_number: number;
  horse_name: string;
  frame?: number;
  mark?: string;
  jockey?: RawJockey | string;
  trainer?: RawTrainer;
  popularity?: number; // オッズから計算するのでオプショナル
  predictions: RawPredictions;
  indices: RawIndices;
  past_races?: RawPastRace[];
  zi_index?: number;
  interval?: number;
  time_mining?: number;
  battle_mining?: number;
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
  horse_num: number | string;
  horse_name: string;
  waku?: string;
  odds: number;
}

export interface RawFukushoOdds {
  horse_num: number | string;
  horse_name: string;
  waku?: string;
  odds: { min: number; max: number };
}

export interface RawCombinationOdds {
  combination: string;
  odds: number | { min: number; max: number };
}

export interface RawOddsEntry {
  odds_type: 'tfw' | 'wakuren' | 'umaren' | 'wide' | 'umatan' | 'sanrenpuku' | 'sanrentan';
  odds_type_name: string;
  race_id?: string;
  timestamp?: string;
  data: {
    tansho?: RawTanshoOdds[];
    fukusho?: RawFukushoOdds[];
    combinations?: RawCombinationOdds[];
  };
}

// ===== レース結果の型 =====

export interface RaceResultPayoutItem {
  払出: string;
  組み合わせ: string;
}

export interface RaceResultPayouts {
  単勝?: RaceResultPayoutItem[];
  複勝?: RaceResultPayoutItem[];
  枠連?: RaceResultPayoutItem[];
  馬連?: RaceResultPayoutItem[];
  馬単?: RaceResultPayoutItem[];
  ワイド?: RaceResultPayoutItem[];
  '3連複'?: RaceResultPayoutItem[];
  '3連単'?: RaceResultPayoutItem[];
}

export interface RaceResultFinish {
  着順: string;
  馬名: string;
  馬番: string;
}

export interface RawRaceResult {
  day: number;
  date: string;
  year: number;
  払戻: RaceResultPayouts;
  着順: RaceResultFinish[];
  開催場所: string;
  レース番号: number;
}

// ===== 馬場状態の型 =====

export interface TrackCondition {
  race_id: string;
  track_condition: string;
}

// ===== UI表示用ステータス =====

export interface HorseStats {
  speed: number;        // AI単勝 (win_rate × 100)
  stamina: number;      // AI連対 (place_rate × 100)
  power: number;        // 最終スコア (final_score)
  guts: number;         // マイニング指数 (mining_index)
  intelligence: number; // 基礎スコア (base_score)
  technique: number;    // レース評価偏差 (corrected_time_deviation正規化)
}

export type EfficiencyRankGrade = 'SS' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | '-';

export interface EfficiencyRank {
  rank: EfficiencyRankGrade;
  label: string;
  returnRate: number;
  color: string;
}

// racing-logic.tsからインポートして使う
export type { Badge, HorseAnalysis, RaceEvaluation, HorseWithRanks } from './lib/racing-logic';

export interface PastRace {
  date: string;
  raceName: string;
  position: number | string;
  place: string;
  distance: number;
  surface: string;
  condition: string;
  runningStyle: string;
  last3f: number;
  ave3f: number;
  margin: number;
  correctedTime: number;
  pci: number;
  frame: number;
  horseNumber: number;
  weight: number;
  weightReduction: string;
  position3f: number;
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

  // 暴走モード用
  battleMining: number;

  // 総合評価（表示用）
  overallRating: number;
  winRate: number;
  placeRate: number;

  // 過去レース（あれば）
  pastRaces: PastRace[];
}

export interface Race {
  id: string;
  originalRaceId: string; // オッズ検索用の元のrace_id（例: "京都2R"）
  name: string;
  date: string;
  location: string;
  round: number;
  distance: number;
  surface: '芝' | 'ダ';
  condition: string;
  trackCondition?: string; // 馬場状態（良、稍重、重、不良）
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

  // レース結果（確定後のみ）
  result?: RaceResultDisplay;
}

// ===== オッズ表示用 =====

export interface OddsDisplay {
  tansho: { horseNum: number; horseName: string; odds: number }[];
  fukusho: { horseNum: number; horseName: string; min: number; max: number }[];
  wakuren: { combination: string; odds: number }[];
  umaren: { combination: string; odds: number }[];
  wide: { combination: string; min: number; max: number }[];
  umatan: { combination: string; odds: number }[];
  sanrenpuku: { combination: string; odds: number }[];
  sanrentan: { combination: string; odds: number }[];
}

// ===== フィルター状態 =====

export interface RaceFilterState {
  date: string | null;
  venue: string | null;
}

// ===== 詳細フィルター =====

export type ComparisonOperator = '>=' | '<=' | '=' | '>' | '<';

export interface NumericFilter {
  enabled: boolean;
  operator: ComparisonOperator;
  value: number;
}

export interface HorseFilters {
  // 効率ランク
  efficiencyRank: {
    enabled: boolean;
    minRank: EfficiencyRankGrade;
  };
  // AI指数
  aiWinRate: NumericFilter;
  aiPlaceRate: NumericFilter;
  aiShowRate: NumericFilter;
  // その他指数
  finalScore: NumericFilter;
  miningIndex: NumericFilter;
  raceEval: NumericFilter;
  ziDeviation: NumericFilter;
  powerScore: NumericFilter;
  // オッズ
  tanshoOdds: NumericFilter;
  // 人気
  popularity: NumericFilter;
}

export interface RaceFilters {
  // レースタイプ
  raceType: {
    enabled: boolean;
    types: Array<'SUPER' | 'GOOD' | 'SOLID' | 'CHAOS' | 'NORMAL' | 'KEN'>;
  };
  // オッズ条件
  noLowOdds: {
    enabled: boolean;
    threshold: number; // この倍率以下の馬がいないレース
  };
  // 1番人気オッズ条件
  favoriteOdds: NumericFilter;
}

// ===== レース結果表示用 =====

export interface RaceResultDisplay {
  date: string;
  payouts: {
    tansho?: { combination: string; payout: number }[];
    fukusho?: { combination: string; payout: number }[];
    wakuren?: { combination: string; payout: number }[];
    umaren?: { combination: string; payout: number }[];
    umatan?: { combination: string; payout: number }[];
    wide?: { combination: string; payout: number }[];
    sanrenpuku?: { combination: string; payout: number }[];
    sanrentan?: { combination: string; payout: number }[];
  };
  finishOrder: { position: number; horseName: string; horseNum: number }[];
}

// ===== 馬券プレビュー型 =====

export interface Bet {
  type: '単勝' | 'ワイド' | '馬連';
  umaban: number;
  umaban2: number;
  name: string;
  amount: number;
  reason: string;
  odds: number;
}

export interface RaceBets {
  venue: string;
  raceNum: number;
  totalAmount: number;
  bets: Bet[];
}

export interface ModeResult {
  mode: 'normal' | 'ura' | 'bousou';
  label: string;
  raceBets: RaceBets | null;
}

export interface CompareResult {
  normal: RaceBets | null;
  ura: RaceBets | null;
  bousou: RaceBets | null;
}

export interface ScoredHorse {
  umaban: number;
  name: string;
  odds: number;
  statusJp: string;
  effRank: string;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C' | '-';
  modesCount: number;
  normalScore: number;
  uraScore: number;
  bousouScore: number;
}

export interface FormationPattern {
  name: string;
  emoji: string;
  description: string;
  col1: number[];
  col2: number[];
  col3: number[];
  count: number;
  amount: number;
  combos?: number[][];
}

export interface FormationResult {
  sanrenpuku: FormationPattern[];
  sanrentan: FormationPattern[];
  scoredHorses: ScoredHorse[];
}

export interface BettingConfig {
  tanshoAmount: number;
  wideAmount: number;
  umarenAmount: number;
  skipLowOdds: boolean;
}
