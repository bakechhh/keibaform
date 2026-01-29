import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, User, Zap, Target, Brain, TrendingUp, MessageSquare } from 'lucide-react';
import { Horse } from '../types';
import StatsRadarChart from './charts/StatsRadarChart';
import PerformanceChart from './charts/PerformanceChart';
import RankBadge from './RankBadge';
import RankPositionBar from './RankPositionBar';
import PastRacesTable from './PastRacesTable';
import RunningStyleAnalysis from './RunningStyleAnalysis';
import { calculateRankDeviationScore } from '../lib/racing-logic';
import { getBracketColor } from '../lib/bracket-utils';
import { useHorseMarksContext } from '../contexts/HorseMarksContext';
import { HORSE_MARKS, MARK_COLORS } from '../hooks/useHorseMarks';
import { HorseMarkBadge } from './HorseMarkSelector';

interface HorseModalProps {
  horse: Horse | null;
  isOpen: boolean;
  onClose: () => void;
  totalHorses?: number;
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
  axis_iron: { label: '👑 鉄板軸', color: '#f59e0b' },
  axis_strong: { label: '🎯 有力軸', color: '#22c55e' },
  axis_value: { label: '💡 妙味軸', color: '#8b5cf6' },
  value_high: { label: '🔥 激熱軸', color: '#ef4444' },
  value: { label: '📌 妙味', color: '#3b82f6' },
  ability: { label: '💡 実力', color: '#06b6d4' },
  safe: { label: '🔗 紐', color: '#6b7280' },
  delete: { label: '✕ 消し', color: '#9ca3af' },
};

export default function HorseModal({ horse, isOpen, onClose, totalHorses = 18 }: HorseModalProps) {
  const { getMark, getMemo, setMark, setMemo } = useHorseMarksContext();
  const [memoText, setMemoText] = useState('');
  const [isMemoEditing, setIsMemoEditing] = useState(false);

  if (!horse) return null;

  const currentMark = getMark(horse.name);
  const currentMemo = getMemo(horse.name);

  const handleSaveMemo = () => {
    setMemo(horse.name, memoText);
    setIsMemoEditing(false);
  };

  const handleStartEditMemo = () => {
    setMemoText(currentMemo);
    setIsMemoEditing(true);
  };

  const statusInfo = statusLabels[horse.analysis.status];
  const winDeviationScore = calculateRankDeviationScore(horse.predictions.win_rate_rank, totalHorses);
  const placeDeviationScore = calculateRankDeviationScore(horse.predictions.place_rate_rank, totalHorses);
  const powerDeviationScore = calculateRankDeviationScore(horse.powerRank, totalHorses);
  const bracketColor = getBracketColor(horse.number, totalHorses);

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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg border-2"
                  style={{
                    backgroundColor: bracketColor.bg,
                    color: bracketColor.text,
                    borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                  }}
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
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/20 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-[10px] text-white/80">総合評価</div>
                <div className="text-xl font-bold text-white">{horse.overallRating}</div>
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
              {/* Mark & Memo Section */}
              <motion.div
                className="p-4 rounded-2xl border-2 border-dashed"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                variants={itemVariants}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <MessageSquare className="w-4 h-4" />
                    マイ印・メモ
                  </h3>
                  {currentMark && (
                    <HorseMarkBadge mark={currentMark} size="lg" showLabel />
                  )}
                </div>

                {/* Mark Selector */}
                <div className="mb-4">
                  <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>印を選択</div>
                  <div className="flex flex-wrap gap-2">
                    {HORSE_MARKS.map(mark => {
                      const colors = MARK_COLORS[mark];
                      const isSelected = currentMark === mark;
                      return (
                        <motion.button
                          key={mark}
                          onClick={() => setMark(horse.name, isSelected ? null : mark)}
                          className={`
                            w-10 h-10 rounded-lg font-bold text-lg flex items-center justify-center
                            ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}
                          `}
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          title={colors.label}
                        >
                          {mark}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {HORSE_MARKS.map(mark => (
                      <span
                        key={mark}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: MARK_COLORS[mark].bg + '30',
                          color: MARK_COLORS[mark].bg,
                        }}
                      >
                        {mark} {MARK_COLORS[mark].label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Memo Section */}
                <div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>メモ</div>
                  {isMemoEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        className="w-full p-3 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                        }}
                        rows={3}
                        placeholder="この馬についてのメモを入力..."
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <motion.button
                          onClick={() => setIsMemoEditing(false)}
                          className="px-3 py-1.5 rounded-lg text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          キャンセル
                        </motion.button>
                        <motion.button
                          onClick={handleSaveMemo}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 text-white"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          保存
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      onClick={handleStartEditMemo}
                      className="p-3 rounded-lg cursor-pointer min-h-[60px]"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                      }}
                      whileHover={{ borderColor: '#10b981' }}
                    >
                      {currentMemo ? (
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                          {currentMemo}
                        </p>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          クリックしてメモを追加...
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Key Metrics Row */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-5 gap-3"
                variants={itemVariants}
              >
                <MetricCard icon={<Trophy className="w-5 h-5" />} label="人気" value={`${horse.popularity}番`} color="#f59e0b" />
                <MetricCard icon={<Zap className="w-5 h-5" />} label="単勝" value={`${horse.tanshoOdds.toFixed(1)}倍`} color="#22c55e" />
                <MetricCard icon={<Target className="w-5 h-5" />} label="PWR順位" value={`${horse.powerRank}位`} color="#8b5cf6" />
                <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="効率ランク" value={horse.efficiency.label} color={horse.efficiency.color} />
                <MetricCard icon={<Brain className="w-5 h-5" />} label="指数" value={horse.indices.final_score.toFixed(1)} color="#06b6d4" />
              </motion.div>

              {/* Analysis Badges with Ranks */}
              {horse.analysis.badges.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2"
                  variants={itemVariants}
                >
                  {horse.analysis.badges.map((badge, i) => {
                    if (badge.style === 'rank' || badge.style === 'gap') {
                      const rankMatch = badge.val.match(/(\d+)/);
                      const rank = rankMatch ? parseInt(rankMatch[1], 10) : 99;
                      return (
                        <RankBadge
                          key={i}
                          label={badge.text}
                          rank={rank}
                          totalHorses={totalHorses}
                          showRank={true}
                          size="md"
                        />
                      );
                    }
                    return (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300"
                      >
                        {badge.text}
                      </span>
                    );
                  })}
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

                {/* Right: Rank Position Bars */}
                <motion.div
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    AI予測順位
                  </h3>
                  <div className="space-y-3">
                    <RankPositionBar
                      rank={horse.predictions.win_rate_rank}
                      totalHorses={totalHorses}
                      label="AI単勝"
                      rawScore={horse.predictions.win_rate}
                      deviationScore={winDeviationScore}
                      color="#ef4444"
                    />
                    <RankPositionBar
                      rank={horse.predictions.place_rate_rank}
                      totalHorses={totalHorses}
                      label="AI連対"
                      rawScore={horse.predictions.place_rate}
                      deviationScore={placeDeviationScore}
                      color="#3b82f6"
                    />
                    <RankPositionBar
                      rank={horse.predictions.show_rate_rank}
                      totalHorses={totalHorses}
                      label="AI複勝"
                      rawScore={horse.predictions.show_rate}
                      color="#22c55e"
                    />
                    <div className="border-t border-[var(--border)] my-2" />
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
                      deviationScore={powerDeviationScore}
                      color="#f59e0b"
                    />
                  </div>
                </motion.div>
              </div>

              {/* AI Scores Grid - Like HorseCard */}
              <motion.div
                className="p-4 rounded-2xl"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                variants={itemVariants}
              >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  AI指数一覧
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
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
                  <ScoreCell
                    label="Mining"
                    score={horse.indices.mining_index.toFixed(1)}
                    rank={horse.miningRank}
                    color="#06b6d4"
                  />
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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
                    label="基礎Sc"
                    score={horse.indices.base_score.toFixed(1)}
                    rank={horse.baseRank}
                    color="#a855f7"
                  />
                  <ScoreCell
                    label="総合力"
                    score={horse.powerScore.toFixed(0)}
                    rank={horse.powerRank}
                    color="#f59e0b"
                  />
                </div>
              </motion.div>

              {/* Performance History (if available) */}
              {horse.pastRaces.length > 0 && (
                <>
                  {/* Running Style Analysis */}
                  <motion.div
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    variants={itemVariants}
                  >
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      脚質・ペース分析
                    </h3>
                    <RunningStyleAnalysis pastRaces={horse.pastRaces} color={horse.color} />
                  </motion.div>

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

                  <motion.div
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    variants={itemVariants}
                  >
                    <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                      過去走一覧
                    </h3>
                    <PastRacesTable pastRaces={horse.pastRaces} />
                  </motion.div>
                </>
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
    <div
      className="text-center p-3 rounded-xl"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="font-bold text-lg" style={{ color }}>
        {score}
      </div>
      <div className={`text-xs font-medium rounded px-2 py-0.5 mt-1 inline-block ${getRankBg(rank)} ${getRankText(rank)}`}>
        {rank}位
      </div>
    </div>
  );
}
