import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { HorseFilters, RaceFilters, NumericFilter, ComparisonOperator } from '../types';

interface AdvancedFiltersProps {
  horseFilters: HorseFilters;
  onHorseFiltersChange: (filters: HorseFilters) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const efficiencyRankOptions = ['SS', 'S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', '-'] as const;
const operatorOptions: { value: ComparisonOperator; label: string }[] = [
  { value: '>=', label: '以上' },
  { value: '<=', label: '以下' },
  { value: '>', label: '超' },
  { value: '<', label: '未満' },
  { value: '=', label: '等しい' },
];

// 数値入力コンポーネント
function NumericFilterInput({
  label,
  filter,
  onChange,
  step = 1,
  allowDecimal = false,
  placeholder = '0',
}: {
  label: string;
  filter: NumericFilter;
  onChange: (filter: NumericFilter) => void;
  step?: number;
  allowDecimal?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={filter.enabled}
          onChange={(e) => onChange({ ...filter, enabled: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
        />
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      </label>
      <select
        value={filter.operator}
        onChange={(e) => onChange({ ...filter, operator: e.target.value as ComparisonOperator })}
        disabled={!filter.enabled}
        className="px-2 py-1 rounded text-xs border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        {operatorOptions.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        step={step}
        value={filter.value}
        onChange={(e) => onChange({ ...filter, value: parseFloat(e.target.value) || 0 })}
        disabled={!filter.enabled}
        placeholder={placeholder}
        className="w-16 px-2 py-1 rounded text-xs border text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}

export default function AdvancedFilters({
  horseFilters,
  onHorseFiltersChange,
  onReset,
  activeFilterCount,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateHorseFilter = <K extends keyof HorseFilters>(key: K, value: HorseFilters[K]) => {
    onHorseFiltersChange({ ...horseFilters, [key]: value });
  };

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors
          ${isOpen || activeFilterCount > 0
            ? 'bg-emerald-500 text-white'
            : 'border border-[var(--border)]'
          }
        `}
        style={{
          color: isOpen || activeFilterCount > 0 ? undefined : 'var(--text-secondary)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-4 h-4" />
        <span>馬フィルター</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
            {activeFilterCount}件
          </span>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </motion.button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-4 rounded-xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Header with Reset */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  馬の絞り込み条件
                </span>
                <button
                  onClick={onReset}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/10"
                  style={{ color: '#ef4444' }}
                >
                  <RotateCcw className="w-3 h-3" />
                  リセット
                </button>
              </div>

              {/* 効率ランク */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  効率ランク
                </h4>
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={horseFilters.efficiencyRank.enabled}
                      onChange={(e) =>
                        updateHorseFilter('efficiencyRank', {
                          ...horseFilters.efficiencyRank,
                          enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      ランク
                    </span>
                  </label>
                  <select
                    value={horseFilters.efficiencyRank.minRank}
                    onChange={(e) =>
                      updateHorseFilter('efficiencyRank', {
                        ...horseFilters.efficiencyRank,
                        minRank: e.target.value as typeof horseFilters.efficiencyRank.minRank,
                      })
                    }
                    disabled={!horseFilters.efficiencyRank.enabled}
                    className="px-2 py-1 rounded text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {efficiencyRankOptions.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}以上
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI指数 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  AI指数（%表示）
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <NumericFilterInput
                    label="AI単勝"
                    filter={horseFilters.aiWinRate}
                    onChange={(f) => updateHorseFilter('aiWinRate', f)}
                    step={1}
                    placeholder="10"
                  />
                  <NumericFilterInput
                    label="AI連対"
                    filter={horseFilters.aiPlaceRate}
                    onChange={(f) => updateHorseFilter('aiPlaceRate', f)}
                    step={1}
                    placeholder="20"
                  />
                  <NumericFilterInput
                    label="AI複勝"
                    filter={horseFilters.aiShowRate}
                    onChange={(f) => updateHorseFilter('aiShowRate', f)}
                    step={1}
                    placeholder="30"
                  />
                </div>
              </div>

              {/* その他指数 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  その他指数
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <NumericFilterInput
                    label="最終Sc"
                    filter={horseFilters.finalScore}
                    onChange={(f) => updateHorseFilter('finalScore', f)}
                    step={1}
                    placeholder="50"
                  />
                  <NumericFilterInput
                    label="Mining"
                    filter={horseFilters.miningIndex}
                    onChange={(f) => updateHorseFilter('miningIndex', f)}
                    step={1}
                    placeholder="50"
                  />
                  <NumericFilterInput
                    label="R評価"
                    filter={horseFilters.raceEval}
                    onChange={(f) => updateHorseFilter('raceEval', f)}
                    step={0.1}
                    allowDecimal
                    placeholder="50"
                  />
                  <NumericFilterInput
                    label="前走ZI"
                    filter={horseFilters.ziDeviation}
                    onChange={(f) => updateHorseFilter('ziDeviation', f)}
                    step={0.1}
                    allowDecimal
                    placeholder="50"
                  />
                  <NumericFilterInput
                    label="総合力"
                    filter={horseFilters.powerScore}
                    onChange={(f) => updateHorseFilter('powerScore', f)}
                    step={1}
                    placeholder="70"
                  />
                </div>
              </div>

              {/* オッズ・人気 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  オッズ・人気
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <NumericFilterInput
                    label="単勝オッズ"
                    filter={horseFilters.tanshoOdds}
                    onChange={(f) => updateHorseFilter('tanshoOdds', f)}
                    step={0.1}
                    allowDecimal
                    placeholder="5.0"
                  />
                  <NumericFilterInput
                    label="人気"
                    filter={horseFilters.popularity}
                    onChange={(f) => updateHorseFilter('popularity', f)}
                    step={1}
                    placeholder="5"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// デフォルトフィルター値
export const defaultHorseFilters: HorseFilters = {
  efficiencyRank: { enabled: false, minRank: 'A' },
  aiWinRate: { enabled: false, operator: '>=', value: 10 },
  aiPlaceRate: { enabled: false, operator: '>=', value: 20 },
  aiShowRate: { enabled: false, operator: '>=', value: 30 },
  finalScore: { enabled: false, operator: '>=', value: 50 },
  miningIndex: { enabled: false, operator: '>=', value: 50 },
  raceEval: { enabled: false, operator: '>=', value: 50 },
  ziDeviation: { enabled: false, operator: '>=', value: 50 },
  powerScore: { enabled: false, operator: '>=', value: 70 },
  tanshoOdds: { enabled: false, operator: '<=', value: 10 },
  popularity: { enabled: false, operator: '<=', value: 5 },
};

export const defaultRaceFilters: RaceFilters = {
  raceType: { enabled: false, types: [] },
  noLowOdds: { enabled: false, threshold: 2.0 },
  favoriteOdds: { enabled: false, operator: '>=', value: 3.0 },
};

// フィルター適用関数
export function applyNumericFilter(value: number, filter: NumericFilter): boolean {
  if (!filter.enabled) return true;
  switch (filter.operator) {
    case '>=': return value >= filter.value;
    case '<=': return value <= filter.value;
    case '>': return value > filter.value;
    case '<': return value < filter.value;
    case '=': return value === filter.value;
    default: return true;
  }
}

export function getEfficiencyRankOrder(rank: string): number {
  const order: Record<string, number> = { 'SS': 0, 'S': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C+': 6, 'C': 7, 'D': 8, '-': 9 };
  return order[rank] ?? 9;
}
