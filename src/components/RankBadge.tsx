import { motion } from 'framer-motion';

interface RankBadgeProps {
  label: string;
  rank: number;
  totalHorses?: number;
  showRank?: boolean;
  size?: 'sm' | 'md';
}

const getRankColor = (rank: number): { bg: string; text: string; border: string } => {
  switch (rank) {
    case 1:
      return { bg: 'bg-amber-400/20', text: 'text-amber-500', border: 'border-amber-400/50' };
    case 2:
      // 銀色: ライトモードでも見えるように濃いめの色に
      return { bg: 'bg-slate-400/20', text: 'text-slate-500 dark:text-slate-300', border: 'border-slate-400/50' };
    case 3:
      return { bg: 'bg-orange-400/20', text: 'text-orange-500', border: 'border-orange-400/50' };
    default:
      return { bg: 'bg-gray-500/10', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-500/30' };
  }
};

const getRankEmoji = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

export default function RankBadge({
  label,
  rank,
  totalHorses,
  showRank = true,
  size = 'sm',
}: RankBadgeProps) {
  const colors = getRankColor(rank);
  const emoji = getRankEmoji(rank);
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}
      `}
      whileHover={{ scale: 1.05 }}
    >
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
      {showRank && (
        <span className="font-bold">
          ({rank}位{totalHorses ? `/${totalHorses}` : ''})
        </span>
      )}
    </motion.span>
  );
}
