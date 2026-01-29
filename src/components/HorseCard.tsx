import { motion } from 'framer-motion';
import { User, MessageSquare } from 'lucide-react';
import { Horse } from '../types';
import RankBadge from './RankBadge';
import RankPositionBar from './RankPositionBar';
import { getBracketColor } from '../lib/bracket-utils';
import { useHorseMarksContext } from '../contexts/HorseMarksContext';
import { InlineMarkSelector } from './HorseMarkSelector';

interface HorseCardProps {
  horse: Horse;
  index: number;
  totalHorses?: number;
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
  axis_iron: '👑鉄板軸',
  axis_strong: '🎯有力軸',
  axis_value: '💡妙味軸',
  value_high: '🔥激熱軸',
  value: '📌妙味',
  ability: '💡実力',
  safe: '🔗紐',
  delete: '✕消し',
};

export default function HorseCard({ horse, index, totalHorses = 18, onClick }: HorseCardProps) {
  const bracketColor = getBracketColor(horse.number, totalHorses);
  const { getMark, getMemo, setMark } = useHorseMarksContext();

  const currentMark = getMark(horse.name);
  const currentMemo = getMemo(horse.name);

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
          {/* Number Badge with Bracket Color */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg border-2"
            style={{
              backgroundColor: bracketColor.bg,
              color: bracketColor.text,
              borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
            }}
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            {horse.number}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {horse.name}
            </h3>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <User className="w-3 h-3" />
              <span>{horse.jockey}</span>
            </div>
            {currentMemo && (
              <div className="flex items-center gap-1 mt-1">
                <MessageSquare className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-amber-500 truncate" title={currentMemo}>
                  {currentMemo}
                </span>
              </div>
            )}
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
            効率{horse.efficiency.rank}
          </span>
        </div>
      </div>

      {/* Inline Mark Selector */}
      <div className="mb-3">
        <InlineMarkSelector
          currentMark={currentMark}
          onSelect={(mark) => setMark(horse.name, mark)}
          compact
        />
      </div>

      {/* Popularity & Odds Row */}
      <div className="flex items-center gap-2 mb-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center flex-shrink-0">
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>人気</div>
          <div className="font-bold text-amber-500">{horse.popularity}番</div>
        </div>
        <div className="text-center flex-shrink-0">
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>単勝</div>
          <div className="font-bold text-emerald-500">{horse.tanshoOdds.toFixed(1)}倍</div>
        </div>
        <motion.div
          className={`
            px-2 py-1 rounded-lg font-bold text-base ml-auto text-white
            ${horse.overallRating >= 85 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
              horse.overallRating >= 70 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
              'bg-zinc-500'}
          `}
          whileHover={{ scale: 1.1 }}
        >
          {horse.overallRating}
        </motion.div>
      </div>

      {/* AI Scores Grid */}
      <div className="grid grid-cols-4 gap-1 mb-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <ScoreCell
          label="AI単勝"
          score={(horse.predictions.win_rate * 100).toFixed(1)}
          rank={horse.predictions.win_rate_rank}
          color="#ef4444"
        />
        <ScoreCell
          label="AI連対"
          score={(horse.predictions.place_rate * 100).toFixed(1)}
          rank={horse.predictions.place_rate_rank}
          color="#3b82f6"
        />
        <ScoreCell
          label="AI複勝"
          score={(horse.predictions.show_rate * 100).toFixed(1)}
          rank={horse.predictions.show_rate_rank}
          color="#22c55e"
        />
        <ScoreCell
          label="最終Sc"
          score={horse.indices.final_score.toFixed(1)}
          rank={horse.finalRank}
          color="#8b5cf6"
        />
      </div>
      <div className="grid grid-cols-4 gap-1 mb-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <ScoreCell
          label="Mining"
          score={horse.indices.mining_index.toFixed(1)}
          rank={horse.miningRank}
          color="#06b6d4"
        />
        <ScoreCell
          label="R評価"
          score={horse.indices.corrected_time_deviation.toFixed(1)}
          rank={horse.raceEvalRank}
          color="#f97316"
        />
        <ScoreCell
          label="前走ZI"
          score={horse.indices.zi_deviation.toFixed(1)}
          rank={horse.ziRank}
          color="#14b8a6"
        />
        <ScoreCell
          label="総合力"
          score={horse.powerScore.toFixed(0)}
          rank={horse.powerRank}
          color="#f59e0b"
        />
      </div>

      {/* Rank Position Bars */}
      <div className="space-y-1.5 mb-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <RankPositionBar
          rank={horse.predictions.win_rate_rank}
          totalHorses={totalHorses}
          label="AI単勝"
          rawScore={horse.predictions.win_rate}
          color="#ef4444"
        />
        <RankPositionBar
          rank={horse.predictions.place_rate_rank}
          totalHorses={totalHorses}
          label="AI連対"
          rawScore={horse.predictions.place_rate}
          color="#3b82f6"
        />
        <RankPositionBar
          rank={horse.predictions.show_rate_rank}
          totalHorses={totalHorses}
          label="AI複勝"
          rawScore={horse.predictions.show_rate}
          color="#22c55e"
        />
        <RankPositionBar
          rank={horse.finalRank}
          totalHorses={totalHorses}
          label="最終Sc"
          rawScore={horse.indices.final_score / 100}
          color="#8b5cf6"
        />
        <RankPositionBar
          rank={horse.miningRank}
          totalHorses={totalHorses}
          label="Mining"
          rawScore={horse.indices.mining_index / 100}
          color="#06b6d4"
        />
        <RankPositionBar
          rank={horse.raceEvalRank}
          totalHorses={totalHorses}
          label="R評価"
          rawScore={horse.indices.corrected_time_deviation / 100}
          color="#f97316"
        />
        <RankPositionBar
          rank={horse.ziRank}
          totalHorses={totalHorses}
          label="前走ZI"
          rawScore={horse.indices.zi_deviation / 100}
          color="#14b8a6"
        />
        <RankPositionBar
          rank={horse.powerRank}
          totalHorses={totalHorses}
          label="総合力"
          rawScore={horse.powerScore / 100}
          color="#f59e0b"
        />
      </div>

      {/* Rank Badges */}
      {horse.analysis.badges.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--border)]">
          {horse.analysis.badges.slice(0, 4).map((badge, i) => {
            // ランク情報がある場合はRankBadgeを使用
            if (badge.style === 'rank' || badge.style === 'gap') {
              const rankMatch = badge.val.match(/(\d+)/);
              const rank = rankMatch ? parseInt(rankMatch[1], 10) : 99;
              return (
                <RankBadge
                  key={i}
                  label={badge.text}
                  rank={rank}
                  showRank={badge.style === 'rank'}
                  size="sm"
                />
              );
            }
            // mainスタイルはそのまま表示
            return (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400"
              >
                {badge.text}
              </span>
            );
          })}
        </div>
      )}

    </motion.div>
  );
}

// スコアと順位を表示するセル
function ScoreCell({
  label,
  score,
  rank,
  color,
}: {
  label: string;
  score: string;
  rank: number;
  color: string;
}) {
  const getRankBg = (r: number) => {
    if (r === 1) return 'bg-amber-500/20';
    if (r === 2) return 'bg-slate-400/20';
    if (r === 3) return 'bg-orange-500/20';
    return 'bg-gray-500/10';
  };

  const getRankText = (r: number) => {
    if (r === 1) return 'text-amber-500';
    if (r === 2) return 'text-slate-500 dark:text-slate-300';
    if (r === 3) return 'text-orange-500';
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className="text-center">
      <div className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="font-bold text-sm" style={{ color }}>
        {score}
      </div>
      <div className={`text-[10px] font-medium rounded px-1 ${getRankBg(rank)} ${getRankText(rank)}`}>
        {rank}位
      </div>
    </div>
  );
}
