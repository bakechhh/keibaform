import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, TrendingUp, Zap, Target, Brain, Award, BarChart2 } from 'lucide-react';
import { Horse } from '../types';

interface HorseComparisonModalProps {
  horse1: Horse | null;
  horse2: Horse | null;
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

interface ComparisonMetric {
  label: string;
  icon: React.ReactNode;
  getValue: (h: Horse) => number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
}

const metrics: ComparisonMetric[] = [
  {
    label: '単勝AI',
    icon: <TrendingUp className="w-4 h-4" />,
    getValue: (h) => h.predictions.win_rate * 100,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    label: '連対AI',
    icon: <Target className="w-4 h-4" />,
    getValue: (h) => h.predictions.place_rate * 100,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    label: '複勝AI',
    icon: <Award className="w-4 h-4" />,
    getValue: (h) => h.predictions.show_rate * 100,
    format: (v) => `${v.toFixed(1)}%`,
    higherIsBetter: true,
  },
  {
    label: '最終Sc',
    icon: <Brain className="w-4 h-4" />,
    getValue: (h) => h.indices.final_score,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: 'Mining',
    icon: <BarChart2 className="w-4 h-4" />,
    getValue: (h) => h.indices.mining_index,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: 'R評価',
    icon: <Zap className="w-4 h-4" />,
    getValue: (h) => h.indices.corrected_time_deviation,
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: '前走ZI',
    icon: <TrendingUp className="w-4 h-4" />,
    getValue: (h) => h.indices.zi_deviation,
    format: (v) => v.toFixed(2),
    higherIsBetter: true,
  },
  {
    label: '基礎Sc',
    icon: <Brain className="w-4 h-4" />,
    getValue: (h) => h.indices.base_score,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: '総合力',
    icon: <Award className="w-4 h-4" />,
    getValue: (h) => h.powerScore,
    format: (v) => v.toFixed(1),
    higherIsBetter: true,
  },
  {
    label: '単勝オッズ',
    icon: <Target className="w-4 h-4" />,
    getValue: (h) => h.tanshoOdds,
    format: (v) => `${v.toFixed(1)}倍`,
    higherIsBetter: false,
  },
];

export default function HorseComparisonModal({
  horse1,
  horse2,
  isOpen,
  onClose,
}: HorseComparisonModalProps) {
  if (!horse1 || !horse2) return null;

  const getWinner = (metric: ComparisonMetric): 'horse1' | 'horse2' | 'tie' => {
    const v1 = metric.getValue(horse1);
    const v2 = metric.getValue(horse2);
    if (Math.abs(v1 - v2) < 0.001) return 'tie';
    if (metric.higherIsBetter) {
      return v1 > v2 ? 'horse1' : 'horse2';
    } else {
      return v1 < v2 ? 'horse1' : 'horse2';
    }
  };

  const horse1Wins = metrics.filter((m) => getWinner(m) === 'horse1').length;
  const horse2Wins = metrics.filter((m) => getWinner(m) === 'horse2').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
            variants={modalVariants}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    1:1 比較
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </motion.button>
              </div>

              {/* Horse Names */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: horse1.color }}
                  >
                    {horse1.number}
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {horse1.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {horse1.jockey}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <div className="text-right">
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {horse2.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {horse2.jockey}
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: horse2.color }}
                  >
                    {horse2.number}
                  </div>
                </div>
              </div>

              {/* Score Summary */}
              <div className="flex items-center justify-center gap-8 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-500">{horse1Wins}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>勝ち</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                  VS
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500">{horse2Wins}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>勝ち</div>
                </div>
              </div>
            </div>

            {/* Comparison Content */}
            <div className="p-6 space-y-3">
              {metrics.map((metric) => {
                const v1 = metric.getValue(horse1);
                const v2 = metric.getValue(horse2);
                const winner = getWinner(metric);
                const format = metric.format || ((v) => v.toFixed(1));

                // Calculate bar widths
                const max = Math.max(v1, v2);
                const w1 = max > 0 ? (v1 / max) * 100 : 50;
                const w2 = max > 0 ? (v2 / max) * 100 : 50;

                return (
                  <motion.div
                    key={metric.label}
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span style={{ color: 'var(--text-secondary)' }}>{metric.icon}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {metric.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Horse 1 Value */}
                      <div className="w-20 text-right">
                        <span
                          className={`font-mono font-bold ${winner === 'horse1' ? 'text-emerald-500' : ''}`}
                          style={{ color: winner !== 'horse1' ? 'var(--text-primary)' : undefined }}
                        >
                          {format(v1)}
                        </span>
                      </div>

                      {/* Bar Chart */}
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-4 rounded-l-full overflow-hidden bg-gray-700/30 flex justify-end">
                          <motion.div
                            className="h-full rounded-l-full"
                            style={{
                              backgroundColor: winner === 'horse1' ? '#22c55e' : horse1.color,
                              opacity: winner === 'horse1' ? 1 : 0.5,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${w1}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex-1 h-4 rounded-r-full overflow-hidden bg-gray-700/30">
                          <motion.div
                            className="h-full rounded-r-full"
                            style={{
                              backgroundColor: winner === 'horse2' ? '#a855f7' : horse2.color,
                              opacity: winner === 'horse2' ? 1 : 0.5,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${w2}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Horse 2 Value */}
                      <div className="w-20 text-left">
                        <span
                          className={`font-mono font-bold ${winner === 'horse2' ? 'text-purple-500' : ''}`}
                          style={{ color: winner !== 'horse2' ? 'var(--text-primary)' : undefined }}
                        >
                          {format(v2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
