import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Filter, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Race, Horse } from './types';
import { useRaceData } from './hooks/useRaceData';
import ThemeToggle from './components/ThemeToggle';
import RaceSelector from './components/RaceSelector';
import HorseCard from './components/HorseCard';
import HorseModal from './components/HorseModal';
import ComparisonBarChart from './components/charts/ComparisonBarChart';

type SortOption = 'number' | 'odds' | 'rating' | 'power' | 'popularity';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('power');
  const [showComparison, setShowComparison] = useState(false);
  const [filterBuyOnly, setFilterBuyOnly] = useState(false);

  const { races, loading, error, refreshData } = useRaceData();

  // 初回ロード時に最初のレースを選択
  useEffect(() => {
    if (races.length > 0 && !selectedRace) {
      setSelectedRace(races[0]);
    }
  }, [races, selectedRace]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const sortedHorses = useMemo(() => {
    if (!selectedRace) return [];

    let horses = [...selectedRace.horses];

    // フィルター
    if (filterBuyOnly) {
      horses = horses.filter(h => h.analysis.isBuy);
    }

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
        default:
          return a.number - b.number;
      }
    });

    return horses;
  }, [selectedRace, sortBy, filterBuyOnly]);

  const handleHorseClick = (horse: Horse) => {
    setSelectedHorse(horse);
    setIsModalOpen(true);
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
                  競馬フォーム分析
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Horse Racing Analytics
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

        {/* Race Selector */}
        {races.length > 0 && (
          <section>
            <motion.h2
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RefreshCw className="w-5 h-5 text-emerald-500" />
              レース選択
              <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                ({races.length}レース)
              </span>
            </motion.h2>
            <RaceSelector
              races={races}
              selectedRace={selectedRace}
              onSelect={setSelectedRace}
            />
          </section>
        )}

        {/* Controls */}
        {selectedRace && (
          <motion.section
            className="flex flex-wrap items-center justify-between gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Sort Options */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                並び替え:
              </span>
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: 'power', label: 'PWR順' },
                  { key: 'number', label: '馬番' },
                  { key: 'odds', label: 'オッズ' },
                  { key: 'rating', label: '評価' },
                  { key: 'popularity', label: '人気' },
                ].map((option) => (
                  <motion.button
                    key={option.key}
                    onClick={() => setSortBy(option.key as SortOption)}
                    className={`
                      px-3 py-1 rounded-lg text-sm font-medium transition-colors
                      ${sortBy === option.key
                        ? 'bg-emerald-500 text-white'
                        : 'hover:bg-emerald-500/20'
                      }
                    `}
                    style={{
                      color: sortBy === option.key ? undefined : 'var(--text-secondary)',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Filter & Comparison Toggle */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setFilterBuyOnly(!filterBuyOnly)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-colors
                  ${filterBuyOnly
                    ? 'bg-purple-500 text-white'
                    : 'border border-[var(--border)]'
                  }
                `}
                style={{
                  color: filterBuyOnly ? undefined : 'var(--text-secondary)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                買い目のみ
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
                比較
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Comparison Charts */}
        <AnimatePresence>
          {showComparison && selectedRace && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid md:grid-cols-2 gap-4"
            >
              <div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <ComparisonBarChart
                  horses={selectedRace.horses}
                  statKey="speed"
                  label="AI勝率"
                />
              </div>
              <div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <ComparisonBarChart
                  horses={selectedRace.horses}
                  statKey="power"
                  label="総合指数"
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Horse Cards Grid */}
        {selectedRace && (
          <section>
            <motion.h2
              className="text-lg font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              出走馬一覧
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                ({sortedHorses.length}/{selectedRace.horses.length}頭)
              </span>
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedHorses.map((horse, index) => (
                <HorseCard
                  key={horse.id}
                  horse={horse}
                  index={index}
                  onClick={() => handleHorseClick(horse)}
                />
              ))}
            </div>
          </section>
        )}

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
      />

      {/* Footer */}
      <footer
        className="border-t py-6 mt-12"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            競馬フォーム分析 - Powered by Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
