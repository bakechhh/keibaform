import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { RaceFilters, ComparisonOperator } from '../types';

interface RaceFilterPanelProps {
  raceFilters: RaceFilters;
  onRaceFiltersChange: (filters: RaceFilters) => void;
  onReset: () => void;
  activeFilterCount: number;
}

const operatorOptions: { value: ComparisonOperator; label: string }[] = [
  { value: '>=', label: '以上' },
  { value: '<=', label: '以下' },
  { value: '>', label: '超' },
  { value: '<', label: '未満' },
];

const raceTypeOptions: { value: 'SUPER' | 'GOOD' | 'SOLID' | 'CHAOS' | 'NORMAL' | 'KEN'; label: string; color: string }[] = [
  { value: 'SUPER', label: '勝負', color: '#dc2626' },
  { value: 'GOOD', label: 'チャンス', color: '#ea580c' },
  { value: 'SOLID', label: '堅実', color: '#15803d' },
  { value: 'CHAOS', label: '波乱', color: '#7e22ce' },
  { value: 'NORMAL', label: '混戦', color: '#b45309' },
  { value: 'KEN', label: '見送り', color: '#94a3b8' },
];

export default function RaceFilterPanel({
  raceFilters,
  onRaceFiltersChange,
  onReset,
  activeFilterCount,
}: RaceFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateRaceFilter = <K extends keyof RaceFilters>(key: K, value: RaceFilters[K]) => {
    onRaceFiltersChange({ ...raceFilters, [key]: value });
  };

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <div className="flex items-center gap-2">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors
            ${isOpen || activeFilterCount > 0
              ? 'bg-purple-500 text-white'
              : 'border border-[var(--border)]'
            }
          `}
          style={{
            color: isOpen || activeFilterCount > 0 ? undefined : 'var(--text-secondary)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter className="w-3 h-3" />
          <span>レース絞り込み</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {activeFilterCount}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </motion.button>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-red-500/10"
            style={{ color: '#ef4444' }}
          >
            <RotateCcw className="w-3 h-3" />
            クリア
          </button>
        )}
      </div>

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
              className="p-3 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              {/* レースタイプ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={raceFilters.raceType.enabled}
                    onChange={(e) =>
                      updateRaceFilter('raceType', {
                        ...raceFilters.raceType,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-3 h-3 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    レースタイプ
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {raceTypeOptions.map((type) => {
                    const isSelected = raceFilters.raceType.types.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          const newTypes = isSelected
                            ? raceFilters.raceType.types.filter((t) => t !== type.value)
                            : [...raceFilters.raceType.types, type.value];
                          updateRaceFilter('raceType', {
                            ...raceFilters.raceType,
                            types: newTypes,
                          });
                        }}
                        disabled={!raceFilters.raceType.enabled}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors disabled:opacity-50 ${
                          isSelected ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: isSelected ? type.color : 'var(--bg-secondary)',
                          color: isSelected ? 'white' : 'var(--text-secondary)',
                        }}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* オッズ条件 */}
              <div className="space-y-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  オッズ条件
                </span>
                <div className="space-y-1.5">
                  {/* 低オッズ馬がいないレース */}
                  <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={raceFilters.noLowOdds.enabled}
                      onChange={(e) =>
                        updateRaceFilter('noLowOdds', {
                          ...raceFilters.noLowOdds,
                          enabled: e.target.checked,
                        })
                      }
                      className="w-3 h-3 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span style={{ color: 'var(--text-primary)' }}>単勝</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.1}
                      value={raceFilters.noLowOdds.threshold}
                      onChange={(e) =>
                        updateRaceFilter('noLowOdds', {
                          ...raceFilters.noLowOdds,
                          threshold: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!raceFilters.noLowOdds.enabled}
                      className="w-14 px-2 py-1 rounded border text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>倍以下の馬がいないレース</span>
                  </div>

                  {/* 1番人気オッズ */}
                  <div className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={raceFilters.favoriteOdds.enabled}
                      onChange={(e) =>
                        updateRaceFilter('favoriteOdds', {
                          ...raceFilters.favoriteOdds,
                          enabled: e.target.checked,
                        })
                      }
                      className="w-3 h-3 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span style={{ color: 'var(--text-primary)' }}>1番人気</span>
                    <select
                      value={raceFilters.favoriteOdds.operator}
                      onChange={(e) =>
                        updateRaceFilter('favoriteOdds', {
                          ...raceFilters.favoriteOdds,
                          operator: e.target.value as ComparisonOperator,
                        })
                      }
                      disabled={!raceFilters.favoriteOdds.enabled}
                      className="px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
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
                      inputMode="decimal"
                      step={0.1}
                      value={raceFilters.favoriteOdds.value}
                      onChange={(e) =>
                        updateRaceFilter('favoriteOdds', {
                          ...raceFilters.favoriteOdds,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!raceFilters.favoriteOdds.enabled}
                      className="w-14 px-2 py-1 rounded border text-right font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>倍</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
