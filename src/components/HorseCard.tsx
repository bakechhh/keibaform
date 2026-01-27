import { motion } from 'framer-motion';
import { TrendingUp, Award, User } from 'lucide-react';
import { Horse } from '../types';
import GameStatusBar from './GameStatusBar';

interface HorseCardProps {
  horse: Horse;
  index: number;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  axis_iron: 'from-amber-400 to-yellow-500',
  axis_strong: 'from-emerald-400 to-green-500',
  axis_value: 'from-purple-400 to-violet-500',
  value_high: 'from-red-400 to-rose-500',
  value: 'from-blue-400 to-indigo-500',
  ability: 'from-cyan-400 to-teal-500',
  safe: 'from-gray-400 to-slate-500',
  delete: 'from-gray-300 to-gray-400',
};

const statusLabels: Record<string, string> = {
  axis_iron: '🏆鉄板',
  axis_strong: '💪有力',
  axis_value: '✨妙味軸',
  value_high: '🔥激熱',
  value: '📌注目',
  ability: '💡実力',
  safe: '🔗紐',
  delete: '✕消し',
};

export default function HorseCard({ horse, index, onClick }: HorseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300
        ${horse.analysis.isBuy
          ? 'border-emerald-500/50 hover:border-emerald-500'
          : 'border-[var(--border)] hover:border-gray-400'
        }
      `}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Number Badge */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
            style={{ backgroundColor: horse.color }}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            {horse.number}
          </motion.div>

          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {horse.name}
            </h3>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <User className="w-3 h-3" />
              <span>{horse.jockey}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <motion.div
            className={`px-2 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${statusColors[horse.analysis.status]}`}
            whileHover={{ scale: 1.05 }}
          >
            {statusLabels[horse.analysis.status]}
          </motion.div>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: horse.efficiency.color, color: 'white' }}
          >
            {horse.efficiency.rank}
          </span>
        </div>
      </div>

      {/* Popularity & Odds */}
      <div className="flex items-center justify-between mb-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>人気</div>
            <div className="font-bold text-amber-500">{horse.popularity}番</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>単勝</div>
            <div className="font-bold text-emerald-500">{horse.tanshoOdds.toFixed(1)}倍</div>
          </div>
          <div className="text-center">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>PWR順</div>
            <div className="font-bold text-purple-500">{horse.powerRank}位</div>
          </div>
        </div>
        <motion.div
          className={`
            px-3 py-1 rounded-lg font-bold text-lg
            ${horse.overallRating >= 85 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white' :
              horse.overallRating >= 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white' :
              'bg-gray-200 dark:bg-gray-700'}
          `}
          style={{ color: horse.overallRating < 70 ? 'var(--text-primary)' : undefined }}
          whileHover={{ scale: 1.1 }}
        >
          {horse.overallRating}
        </motion.div>
      </div>

      {/* AI Predictions */}
      <div className="space-y-2 mb-3">
        <GameStatusBar label="WIN" value={horse.winRate} color="#ef4444" />
        <GameStatusBar label="PLC" value={horse.placeRate} color="#3b82f6" />
        <GameStatusBar label="IDX" value={Math.round(horse.indices.final_score)} color="#f59e0b" />
      </div>

      {/* Badges */}
      {horse.analysis.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--border)]">
          {horse.analysis.badges.slice(0, 3).map((badge, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${
                badge.style === 'gap' ? 'bg-purple-500/20 text-purple-400' :
                badge.style === 'main' ? 'bg-amber-500/20 text-amber-400' :
                ''
              }`}
              style={{
                backgroundColor: badge.style === 'rank' ? 'var(--bg-secondary)' : undefined,
                color: badge.style === 'rank' ? 'var(--text-secondary)' : undefined,
              }}
            >
              {badge.style === 'gap' ? `${badge.text}(${badge.val})` : badge.text}
            </span>
          ))}
        </div>
      )}

      {/* Win Rates */}
      <div className="flex items-center gap-4 pt-3 mt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            勝率: <span className="font-bold text-emerald-500">{horse.winRate}%</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            複勝率: <span className="font-bold text-blue-500">{horse.placeRate}%</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
