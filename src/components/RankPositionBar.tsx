import { motion } from 'framer-motion';

interface RankPositionBarProps {
  rank: number;
  totalHorses: number;
  label: string;
  deviationScore?: number;
  rawScore?: number; // 0-1のスコアを100倍して表示
  color?: string;
}

export default function RankPositionBar({
  rank,
  totalHorses,
  label,
  deviationScore,
  rawScore,
  color = '#22c55e',
}: RankPositionBarProps) {
  // 位置を計算（1位が100%、最下位が0%）
  const position = totalHorses > 1 ? ((totalHorses - rank) / (totalHorses - 1)) * 100 : 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
          {rawScore !== undefined && (
            <span className="ml-1 font-bold" style={{ color }}>
              {(rawScore * 100).toFixed(1)}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color }}>
            {rank}位/{totalHorses}頭
          </span>
          {deviationScore !== undefined && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: deviationScore >= 60 ? 'rgba(34, 197, 94, 0.2)' :
                  deviationScore >= 50 ? 'rgba(234, 179, 8, 0.2)' :
                  'rgba(107, 114, 128, 0.2)',
                color: deviationScore >= 60 ? '#22c55e' :
                  deviationScore >= 50 ? '#eab308' :
                  '#6b7280',
              }}
            >
              偏差値{deviationScore.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${position}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Position marker */}
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
