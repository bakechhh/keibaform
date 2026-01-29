import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, User, TrendingUp, Zap, Target, Brain } from 'lucide-react';
import { Horse } from '../types';
import StatsRadarChart from './charts/StatsRadarChart';
import PerformanceChart from './charts/PerformanceChart';
import WinRateChart from './charts/WinRateChart';
import GameStatusBar from './GameStatusBar';

interface HorseModalProps {
  horse: Horse | null;
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  axis_iron: { label: '🏆 鉄板軸', color: '#f59e0b' },
  axis_strong: { label: '💪 有力軸', color: '#22c55e' },
  axis_value: { label: '✨ 妙味軸', color: '#8b5cf6' },
  value_high: { label: '🔥 激熱', color: '#ef4444' },
  value: { label: '📌 注目', color: '#3b82f6' },
  ability: { label: '💡 実力馬', color: '#06b6d4' },
  safe: { label: '🔗 紐候補', color: '#6b7280' },
  delete: { label: '✕ 消し', color: '#9ca3af' },
};

export default function HorseModal({ horse, isOpen, onClose }: HorseModalProps) {
  if (!horse) return null;

  const statusInfo = statusLabels[horse.analysis.status];

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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
            variants={modalVariants}
          >
            {/* Header with gradient */}
            <motion.div
              className="relative h-36 rounded-t-3xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${horse.color}88, ${horse.color})`,
              }}
              variants={itemVariants}
            >
              {/* Animated background pattern */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
                animate={{ x: [0, 30], y: [0, 30] }}
                transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
              />

              {/* Horse number and name */}
              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {horse.number}
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {horse.name}
                  </h2>
                  <div className="flex items-center gap-3 text-white/90">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {horse.jockey}
                    </span>
                    <span className="px-2 py-0.5 rounded text-sm font-bold" style={{ backgroundColor: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Rating Badge */}
              <motion.div
                className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-xs text-white/80">総合評価</div>
                <div className="text-3xl font-bold text-white">{horse.overallRating}</div>
              </motion.div>

              {/* Close button */}
              <motion.button
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white"
                onClick={onClose}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.4)' }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Key Metrics Row */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-5 gap-3"
                variants={itemVariants}
              >
                <MetricCard icon={<Trophy className="w-5 h-5" />} label="人気" value={`${horse.popularity}番`} color="#f59e0b" />
                <MetricCard icon={<Zap className="w-5 h-5" />} label="単勝" value={`${horse.tanshoOdds.toFixed(1)}倍`} color="#22c55e" />
                <MetricCard icon={<Target className="w-5 h-5" />} label="PWR順位" value={`${horse.powerRank}位`} color="#8b5cf6" />
                <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="効率" value={horse.efficiency.label} color={horse.efficiency.color} />
                <MetricCard icon={<Brain className="w-5 h-5" />} label="指数" value={horse.indices.final_score.toFixed(1)} color="#06b6d4" />
              </motion.div>

              {/* Analysis Badges */}
              {horse.analysis.badges.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2"
                  variants={itemVariants}
                >
                  {horse.analysis.badges.map((badge, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        badge.style === 'main' ? 'bg-amber-500/20 text-amber-300' :
                        badge.style === 'gap' ? 'bg-purple-500/20 text-purple-300' :
                        ''
                      }`}
                      style={{
                        backgroundColor: badge.style === 'rank' ? 'var(--bg-secondary)' : undefined,
                        color: badge.style === 'rank' ? 'var(--text-primary)' : undefined,
                      }}
                    >
                      {badge.style === 'gap' ? `${badge.text}(${badge.val})` : badge.text}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Radar Chart */}
                <motion.div
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    能力チャート
                  </h3>
                  <StatsRadarChart stats={horse.stats} color={horse.color} />
                </motion.div>

                {/* Right: Game Status Bars */}
                <motion.div
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    AI予測 & 指数
                  </h3>
                  <div className="space-y-3">
                    <GameStatusBar label="AI単勝" value={horse.winRate} color="#ef4444" />
                    <GameStatusBar label="AI連対" value={horse.placeRate} color="#3b82f6" />
                    <GameStatusBar label="AI複勝" value={Math.round(horse.predictions.show_rate * 100)} color="#22c55e" />
                    <div className="border-t border-[var(--border)] my-2" />
                    <GameStatusBar label="最終Sc" value={Math.round(horse.indices.final_score)} color="#f59e0b" />
                    <GameStatusBar label="Mining" value={Math.round(horse.indices.mining_index)} color="#8b5cf6" />
                    <GameStatusBar label="基礎Sc" value={Math.round(horse.indices.base_score)} color="#06b6d4" />
                  </div>
                </motion.div>
              </div>

              {/* Win Rates */}
              <motion.div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                variants={itemVariants}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  勝率・複勝率
                </h3>
                <WinRateChart winRate={horse.winRate} placeRate={horse.placeRate} />
              </motion.div>

              {/* Performance History (if available) */}
              {horse.pastRaces.length > 0 && (
                <motion.div
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    着順推移
                  </h3>
                  <PerformanceChart pastRaces={horse.pastRaces} color={horse.color} />
                </motion.div>
              )}

              {/* Raw Indices (Debug/Detail View) */}
              <motion.div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                variants={itemVariants}
              >
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  詳細データ
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <DetailItem label="補正タイム偏差" value={horse.indices.corrected_time_deviation.toFixed(2)} />
                  <DetailItem label="前走ZI偏差" value={horse.indices.zi_deviation.toFixed(2)} />
                  <DetailItem label="複勝オッズ" value={`${horse.fukushoOdds.min.toFixed(1)}-${horse.fukushoOdds.max.toFixed(1)}`} />
                  <DetailItem label="PowerScore" value={horse.powerScore.toFixed(1)} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      className="p-3 rounded-xl flex items-center gap-2"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
      whileHover={{ scale: 1.02 }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
        <div className="font-bold" style={{ color }}>{value}</div>
      </div>
    </motion.div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
