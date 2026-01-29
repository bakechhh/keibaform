import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Filter, RefreshCw, Loader2, AlertCircle, Users, DollarSign, Radar, TrendingUp, Trophy, Calculator } from 'lucide-react';
import { Race, Horse, HorseFilters, RaceFilters } from './types';
import { useRaceData, useOddsData } from './hooks/useRaceData';
import { useRaceResults } from './hooks/useRaceResults';
import ThemeToggle from './components/ThemeToggle';
import RaceSelector from './components/RaceSelector';
import HorseCard from './components/HorseCard';
import HorseModal from './components/HorseModal';
import ComparisonBarChart from './components/charts/ComparisonBarChart';
import VenueTabs from './components/VenueTabs';
import OddsView from './components/OddsView';
import HorseComparisonModal from './components/HorseComparisonModal';
import MultiHorseComparisonModal from './components/MultiHorseComparisonModal';
import RaceAnalysisView from './components/RaceAnalysisView';
import RaceFilterPanel from './components/RaceFilterPanel';
import RaceNavigation from './components/RaceNavigation';
import RaceResultsView from './components/RaceResultsView';
import ExpectedValueAnalysis from './components/ExpectedValueAnalysis';
import ExportPanel from './components/ExportPanel';
import FilterTemplateSelector from './components/FilterTemplateSelector';
import { FilterCondition, applyFilterConditions } from './hooks/useFilterTemplates';
import AdvancedFilters, {
  defaultHorseFilters,
  defaultRaceFilters,
  applyNumericFilter,
  getEfficiencyRankOrder,
} from './components/AdvancedFilters';

type SortOption = 'number' | 'odds' | 'rating' | 'power' | 'popularity' | 'ai_win' | 'ai_place' | 'ai_show' | 'final_score' | 'mining' | 'race_eval' | 'zi';
type ViewMode = 'horses' | 'odds' | 'analysis' | 'results';
type AnalysisTab = 'overview' | 'expected_value';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('power');
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('horses');

  // 1:1比較用の状態
  const [comparisonMode, setComparisonMode] = useState(false);
  const [horse1ForComparison, setHorse1ForComparison] = useState<Horse | null>(null);
  const [horse2ForComparison, setHorse2ForComparison] = useState<Horse | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // 複数馬レーダー比較
  const [isMultiComparisonOpen, setIsMultiComparisonOpen] = useState(false);

  // 分析タブ
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('overview');

  // テンプレートフィルター
  const [templateFilter, setTemplateFilter] = useState<FilterCondition | null>(null);

  // エクスポート用ref
  const horseCardsRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const evAnalysisRef = useRef<HTMLDivElement>(null);

  // 詳細フィルター
  const [horseFilters, setHorseFilters] = useState<HorseFilters>(defaultHorseFilters);
  const [raceFilters, setRaceFilters] = useState<RaceFilters>(defaultRaceFilters);

  const { races, loading, error, refreshData } = useRaceData();
  const { odds: oddsData, loading: oddsLoading } = useOddsData(selectedRace?.originalRaceId || null);

  // レース結果データ
  const {
    loading: resultsLoading,
    getResultByVenueRound,
  } = useRaceResults();

  // 選択中のレースの結果を取得（locationとroundで直接検索）
  const selectedRaceResult = useMemo(() => {
    if (!selectedRace) return null;
    return getResultByVenueRound(selectedRace.location, selectedRace.round) || null;
  }, [selectedRace, getResultByVenueRound]);

  // 開催場所一覧を取得
  const venues = useMemo(() => {
    const venueSet = new Set(races.map(r => r.location));
    return Array.from(venueSet).sort();
  }, [races]);


  // 開催場所でフィルタリングされたレース
  const venueFilteredRaces = useMemo(() => {
    if (!selectedVenue) return races;
    return races.filter(r => r.location === selectedVenue);
  }, [races, selectedVenue]);

  // レースフィルター適用
  const filteredRaces = useMemo(() => {
    return venueFilteredRaces.filter(race => {
      // レースタイプフィルター
      if (raceFilters.raceType.enabled && raceFilters.raceType.types.length > 0) {
        if (!raceFilters.raceType.types.includes(race.evaluation.type)) {
          return false;
        }
      }

      // 低オッズ馬がいないレースフィルター
      if (raceFilters.noLowOdds.enabled) {
        const hasLowOdds = race.horses.some(h => h.tanshoOdds <= raceFilters.noLowOdds.threshold);
        if (hasLowOdds) return false;
      }

      // 1番人気オッズフィルター
      if (raceFilters.favoriteOdds.enabled) {
        const favorite = race.horses.reduce((min, h) => h.popularity < min.popularity ? h : min, race.horses[0]);
        if (favorite && !applyNumericFilter(favorite.tanshoOdds, raceFilters.favoriteOdds)) {
          return false;
        }
      }

      return true;
    });
  }, [venueFilteredRaces, raceFilters]);

  // フィルター適用時・初回ロード時にレースを選択
  useEffect(() => {
    if (filteredRaces.length > 0) {
      // 現在の選択がフィルター結果に含まれていない場合、最初のレースを選択
      if (!selectedRace || !filteredRaces.find(r => r.id === selectedRace.id)) {
        setSelectedRace(filteredRaces[0]);
      }
    } else if (filteredRaces.length === 0 && selectedRace) {
      // フィルター結果が空の場合、選択をクリア
      setSelectedRace(null);
    }
  }, [filteredRaces, selectedRace]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 馬フィルター適用
  const filteredHorses = useMemo(() => {
    if (!selectedRace) return [];

    let horses = selectedRace.horses.filter(horse => {
      // 効率ランクフィルター
      if (horseFilters.efficiencyRank.enabled) {
        const horseRankOrder = getEfficiencyRankOrder(horse.efficiency.rank);
        const minRankOrder = getEfficiencyRankOrder(horseFilters.efficiencyRank.minRank);
        if (horseRankOrder > minRankOrder) return false;
      }

      // AI指数フィルター（%表示なので100倍した値で比較）
      if (!applyNumericFilter(horse.predictions.win_rate * 100, horseFilters.aiWinRate)) return false;
      if (!applyNumericFilter(horse.predictions.place_rate * 100, horseFilters.aiPlaceRate)) return false;
      if (!applyNumericFilter(horse.predictions.show_rate * 100, horseFilters.aiShowRate)) return false;

      // その他指数フィルター
      if (!applyNumericFilter(horse.indices.final_score, horseFilters.finalScore)) return false;
      if (!applyNumericFilter(horse.indices.mining_index, horseFilters.miningIndex)) return false;
      if (!applyNumericFilter(horse.indices.corrected_time_deviation, horseFilters.raceEval)) return false;
      if (!applyNumericFilter(horse.indices.zi_deviation, horseFilters.ziDeviation)) return false;
      if (!applyNumericFilter(horse.powerScore, horseFilters.powerScore)) return false;

      // オッズ・人気フィルター
      if (!applyNumericFilter(horse.tanshoOdds, horseFilters.tanshoOdds)) return false;
      if (!applyNumericFilter(horse.popularity, horseFilters.popularity)) return false;

      return true;
    });

    // テンプレートフィルター適用
    if (templateFilter) {
      horses = applyFilterConditions(horses, templateFilter);
    }

    return horses;
  }, [selectedRace, horseFilters, templateFilter]);

  const sortedHorses = useMemo(() => {
    let horses = [...filteredHorses];

    // ソート
    horses.sort((a, b) => {
      switch (sortBy) {
        case 'odds':
          return a.tanshoOdds - b.tanshoOdds;
        case 'rating':
          return b.overallRating - a.overallRating;
        case 'power':
          return a.powerRank - b.powerRank;
        case 'popularity':
          return a.popularity - b.popularity;
        case 'ai_win':
          return a.predictions.win_rate_rank - b.predictions.win_rate_rank;
        case 'ai_place':
          return a.predictions.place_rate_rank - b.predictions.place_rate_rank;
        case 'ai_show':
          return a.predictions.show_rate_rank - b.predictions.show_rate_rank;
        case 'final_score':
          return a.finalRank - b.finalRank;
        case 'mining':
          return a.miningRank - b.miningRank;
        case 'race_eval':
          return a.raceEvalRank - b.raceEvalRank;
        case 'zi':
          return a.ziRank - b.ziRank;
        default:
          return a.number - b.number;
      }
    });

    return horses;
  }, [filteredHorses, sortBy]);

  const handleHorseClick = (horse: Horse) => {
    if (comparisonMode) {
      // 比較モード時の処理
      if (!horse1ForComparison) {
        setHorse1ForComparison(horse);
      } else if (!horse2ForComparison && horse.id !== horse1ForComparison.id) {
        setHorse2ForComparison(horse);
        setIsComparisonModalOpen(true);
      }
    } else {
      setSelectedHorse(horse);
      setIsModalOpen(true);
    }
  };

  const handleComparisonModeToggle = () => {
    if (comparisonMode) {
      // モードを終了
      setComparisonMode(false);
      setHorse1ForComparison(null);
      setHorse2ForComparison(null);
    } else {
      // モードを開始
      setComparisonMode(true);
      setHorse1ForComparison(null);
      setHorse2ForComparison(null);
    }
  };

  // フィルターリセット
  const handleHorseFilterReset = () => {
    setHorseFilters(defaultHorseFilters);
  };

  const handleRaceFilterReset = () => {
    setRaceFilters(defaultRaceFilters);
  };

  // アクティブ馬フィルター数
  const activeHorseFilterCount = useMemo(() => {
    let count = 0;
    if (horseFilters.efficiencyRank.enabled) count++;
    if (horseFilters.aiWinRate.enabled) count++;
    if (horseFilters.aiPlaceRate.enabled) count++;
    if (horseFilters.aiShowRate.enabled) count++;
    if (horseFilters.finalScore.enabled) count++;
    if (horseFilters.miningIndex.enabled) count++;
    if (horseFilters.raceEval.enabled) count++;
    if (horseFilters.ziDeviation.enabled) count++;
    if (horseFilters.powerScore.enabled) count++;
    if (horseFilters.tanshoOdds.enabled) count++;
    if (horseFilters.popularity.enabled) count++;
    return count;
  }, [horseFilters]);

  // アクティブレースフィルター数
  const activeRaceFilterCount = useMemo(() => {
    let count = 0;
    if (raceFilters.raceType.enabled && raceFilters.raceType.types.length > 0) count++;
    if (raceFilters.noLowOdds.enabled) count++;
    if (raceFilters.favoriteOdds.enabled) count++;
    return count;
  }, [raceFilters]);

  const handleComparisonModalClose = () => {
    setIsComparisonModalOpen(false);
    setHorse1ForComparison(null);
    setHorse2ForComparison(null);
    setComparisonMode(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  UmaAi
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  AI競馬データベース
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={refreshData}
                className="p-2 rounded-lg hover:bg-emerald-500/20 transition-colors"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                  style={{ color: 'var(--text-secondary)' }}
                />
              </motion.button>
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Loading State */}
        {loading && races.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>レースデータを読み込み中...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </motion.div>
        )}

        {/* Venue Tabs */}
        {races.length > 0 && (
          <section>
            <VenueTabs
              venues={venues}
              selectedVenue={selectedVenue}
              onSelect={setSelectedVenue}
            />
          </section>
        )}

        {/* Race Selector */}
        {venueFilteredRaces.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <motion.h2
                className="text-lg font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                レース選択
                <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                  ({filteredRaces.length}{activeRaceFilterCount > 0 ? ` / 全${venueFilteredRaces.length}` : ''}レース)
                </span>
              </motion.h2>
              <RaceFilterPanel
                raceFilters={raceFilters}
                onRaceFiltersChange={setRaceFilters}
                onReset={handleRaceFilterReset}
                activeFilterCount={activeRaceFilterCount}
              />
            </div>
            {filteredRaces.length > 0 ? (
              <RaceSelector
                key={`races-${filteredRaces.map(r => r.id).join('-')}-selected-${selectedRace?.id || 'none'}`}
                races={filteredRaces}
                selectedRace={selectedRace}
                onSelect={setSelectedRace}
              />
            ) : (
              <motion.div
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: 'var(--bg-card)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  フィルター条件に一致するレースがありません
                </p>
                <button
                  onClick={handleRaceFilterReset}
                  className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  フィルターをクリア
                </button>
              </motion.div>
            )}
          </section>
        )}

        {/* View Mode Toggle & Navigation */}
        {selectedRace && (
          <motion.section
            className="flex items-center gap-2 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              onClick={() => setViewMode('horses')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
                ${viewMode === 'horses'
                  ? 'bg-emerald-500 text-white'
                  : 'border border-[var(--border)]'
                }
              `}
              style={{
                color: viewMode === 'horses' ? undefined : 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-4 h-4" />
              出走馬
            </motion.button>
            <motion.button
              onClick={() => setViewMode('odds')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
                ${viewMode === 'odds'
                  ? 'bg-emerald-500 text-white'
                  : 'border border-[var(--border)]'
                }
              `}
              style={{
                color: viewMode === 'odds' ? undefined : 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <DollarSign className="w-4 h-4" />
              オッズ
            </motion.button>
            <motion.button
              onClick={() => setViewMode('analysis')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
                ${viewMode === 'analysis'
                  ? 'bg-emerald-500 text-white'
                  : 'border border-[var(--border)]'
                }
              `}
              style={{
                color: viewMode === 'analysis' ? undefined : 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingUp className="w-4 h-4" />
              分析
            </motion.button>
            <motion.button
              onClick={() => setViewMode('results')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
                ${viewMode === 'results'
                  ? 'bg-amber-500 text-white'
                  : 'border border-[var(--border)]'
                }
              `}
              style={{
                color: viewMode === 'results' ? undefined : 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trophy className="w-4 h-4" />
              結果
              {selectedRaceResult && (
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </motion.button>

            {/* Race Navigation */}
            <div className="ml-auto">
              <RaceNavigation
                races={filteredRaces}
                allRaces={races}
                selectedRace={selectedRace}
                onSelect={setSelectedRace}
              />
            </div>
          </motion.section>
        )}

        {/* Odds View */}
        <AnimatePresence mode="wait">
          {viewMode === 'odds' && selectedRace && (
            <motion.section
              key="odds"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OddsView odds={oddsData} loading={oddsLoading} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Analysis View */}
        <AnimatePresence mode="wait">
          {viewMode === 'analysis' && selectedRace && (
            <motion.section
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Analysis Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <motion.button
                  onClick={() => setAnalysisTab('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                    analysisTab === 'overview' ? 'bg-emerald-500 text-white' : 'border border-[var(--border)]'
                  }`}
                  style={{ color: analysisTab === 'overview' ? undefined : 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TrendingUp className="w-4 h-4" />
                  総合分析
                </motion.button>
                <motion.button
                  onClick={() => setAnalysisTab('expected_value')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                    analysisTab === 'expected_value' ? 'bg-emerald-500 text-white' : 'border border-[var(--border)]'
                  }`}
                  style={{ color: analysisTab === 'expected_value' ? undefined : 'var(--text-secondary)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calculator className="w-4 h-4" />
                  期待値分析
                </motion.button>

                {/* Export Panel */}
                <div className="ml-auto">
                  <ExportPanel
                    targets={[
                      { id: 'analysis', name: '総合分析', ref: analysisRef },
                      { id: 'ev', name: '期待値分析', ref: evAnalysisRef },
                    ]}
                    raceInfo={{
                      raceName: `${selectedRace.location}${selectedRace.round}R`,
                      date: new Date().toISOString().split('T')[0],
                    }}
                  />
                </div>
              </div>

              {/* Analysis Content */}
              <AnimatePresence mode="wait">
                {analysisTab === 'overview' && (
                  <motion.div
                    key="overview"
                    ref={analysisRef}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      レース分析
                    </h3>
                    <RaceAnalysisView horses={selectedRace.horses} />
                  </motion.div>
                )}

                {analysisTab === 'expected_value' && (
                  <motion.div
                    key="expected_value"
                    ref={evAnalysisRef}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                  >
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      期待値分析
                    </h3>
                    <ExpectedValueAnalysis
                      horses={selectedRace.horses}
                      totalHorses={selectedRace.horses.length}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results View */}
        <AnimatePresence mode="wait">
          {viewMode === 'results' && selectedRace && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <RaceResultsView
                result={selectedRaceResult}
                loading={resultsLoading}
                raceName={`${selectedRace.location}${selectedRace.round}R ${selectedRace.name}`}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Horse View */}
        <AnimatePresence mode="wait">
          {viewMode === 'horses' && selectedRace && (
            <motion.div
              key="horses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Controls */}
              <motion.section
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Sort Options */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    並び替え:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <optgroup label="基本">
                      <option value="power">総合力順</option>
                      <option value="number">馬番順</option>
                      <option value="popularity">人気順</option>
                      <option value="odds">オッズ順</option>
                      <option value="rating">評価順</option>
                    </optgroup>
                    <optgroup label="AI指数">
                      <option value="ai_win">AI単勝順</option>
                      <option value="ai_place">AI連対順</option>
                      <option value="ai_show">AI複勝順</option>
                    </optgroup>
                    <optgroup label="その他指数">
                      <option value="final_score">最終Sc順</option>
                      <option value="mining">Mining順</option>
                      <option value="race_eval">R評価順</option>
                      <option value="zi">前走ZI順</option>
                    </optgroup>
                  </select>
                </div>

                {/* Comparison Toggles */}
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    onClick={handleComparisonModeToggle}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors
                      ${comparisonMode
                        ? 'bg-purple-500 text-white'
                        : 'border border-[var(--border)]'
                      }
                    `}
                    style={{
                      color: comparisonMode ? undefined : 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Users className="w-4 h-4" />
                    1:1比較
                    {comparisonMode && horse1ForComparison && (
                      <span className="text-xs">
                        ({horse1ForComparison.number}番選択中)
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => setIsMultiComparisonOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors border border-[var(--border)]"
                    style={{ color: 'var(--text-secondary)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Radar className="w-4 h-4" />
                    レーダー比較
                  </motion.button>

                  <motion.button
                    onClick={() => setShowComparison(!showComparison)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors
                      ${showComparison
                        ? 'bg-amber-500 text-white'
                        : 'border border-[var(--border)]'
                      }
                    `}
                    style={{
                      color: showComparison ? undefined : 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    チャート
                  </motion.button>

                  {/* Horse Filter */}
                  <AdvancedFilters
                    horseFilters={horseFilters}
                    onHorseFiltersChange={setHorseFilters}
                    onReset={handleHorseFilterReset}
                    activeFilterCount={activeHorseFilterCount}
                  />

                  {/* Filter Template */}
                  <FilterTemplateSelector
                    onApply={(conditions) => setTemplateFilter(conditions)}
                  />

                  {/* Export Panel */}
                  <ExportPanel
                    targets={[
                      { id: 'horses', name: '出走馬一覧', ref: horseCardsRef },
                      { id: 'chart', name: 'チャート', ref: chartRef },
                    ]}
                    raceInfo={selectedRace ? {
                      raceName: `${selectedRace.location}${selectedRace.round}R`,
                      date: new Date().toISOString().split('T')[0],
                    } : undefined}
                  />
                </div>
              </motion.section>

              {/* Comparison Mode Hint */}
              {comparisonMode && (
                <motion.div
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-purple-400">
                    {!horse1ForComparison
                      ? '比較する1頭目の馬をクリックしてください'
                      : '比較する2頭目の馬をクリックしてください'}
                  </p>
                </motion.div>
              )}

              {/* Comparison Charts */}
              <AnimatePresence>
                {showComparison && selectedRace && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div
                      ref={chartRef}
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                      <ComparisonBarChart horses={selectedRace.horses} />
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Horse Cards Grid */}
              <section ref={horseCardsRef}>
                <motion.h2
                  className="text-lg font-bold mb-4"
                  style={{ color: 'var(--text-primary)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  出走馬一覧
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                    ({sortedHorses.length}頭{selectedRace && sortedHorses.length !== selectedRace.horses.length && ` / 全${selectedRace.horses.length}頭`})
                  </span>
                </motion.h2>

                {sortedHorses.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedHorses.map((horse, index) => (
                      <div
                        key={horse.id}
                        className={`relative ${comparisonMode && horse1ForComparison?.id === horse.id ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
                      >
                        <HorseCard
                          horse={horse}
                          index={index}
                          totalHorses={selectedRace.horses.length}
                          onClick={() => handleHorseClick(horse)}
                        />
                        {comparisonMode && horse1ForComparison?.id === horse.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            1
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="p-6 rounded-xl text-center"
                    style={{ backgroundColor: 'var(--bg-card)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      フィルター条件に一致する馬がいません
                    </p>
                    <button
                      onClick={handleHorseFilterReset}
                      className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      馬フィルターをクリア
                    </button>
                  </motion.div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && races.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              レースデータがありません
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Supabaseの接続を確認してください
            </p>
          </motion.div>
        )}
      </main>

      {/* Horse Detail Modal */}
      <HorseModal
        horse={selectedHorse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        totalHorses={selectedRace?.horses.length}
      />

      {/* Horse Comparison Modal */}
      <HorseComparisonModal
        horse1={horse1ForComparison}
        horse2={horse2ForComparison}
        isOpen={isComparisonModalOpen}
        onClose={handleComparisonModalClose}
      />

      {/* Multi Horse Comparison Modal */}
      {selectedRace && (
        <MultiHorseComparisonModal
          horses={selectedRace.horses}
          isOpen={isMultiComparisonOpen}
          onClose={() => setIsMultiComparisonOpen(false)}
        />
      )}

      {/* Footer */}
      <footer
        className="border-t py-6 mt-12"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AI競馬データベース - UmaAi
          </p>
        </div>
      </footer>
    </div>
  );
}
