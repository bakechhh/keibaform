import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, TrendingUp, Users, Target, Ban } from 'lucide-react';
import { Race } from '../types';
import { getBracketColor } from '../lib/bracket-utils';

// ===== ミニバッジ（RaceSelector用）=====
export function SkipBadge({ race }: { race: Race }) {
  const sc = race.skipCheck;
  if (!sc) return null;

  if (sc.shouldSkip) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
        <ShieldX className="w-3 h-3" />
        見送り
      </span>
    );
  }

  if (sc.reasons.length > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
        <ShieldAlert className="w-3 h-3" />
        注意
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
      <ShieldCheck className="w-3 h-3" />
      買い
    </span>
  );
}

// ===== レースグレードバッジ =====
function RaceGradeBadge({ grade }: { grade: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    '最良': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    '良い': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    '普通': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    '見送り': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  };
  const c = config[grade] ?? config['普通'];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {grade}
    </span>
  );
}

// ===== 詳細パネル（RaceAnalysisView等用）=====
interface SkipCheckerPanelProps {
  race: Race;
}

export default function SkipCheckerPanel({ race }: SkipCheckerPanelProps) {
  const sc = race.skipCheck;
  if (!sc) return null;

  const isSkip = sc.shouldSkip;
  const hasWarnings = sc.reasons.filter(r => r.severity === '警告').length > 0;
  const isBuy = !isSkip;

  // ヘッダーの色
  const headerColor = isSkip ? '#ef4444' : hasWarnings ? '#f59e0b' : '#22c55e';
  const headerBg = isSkip ? 'rgba(239,68,68,0.08)' : hasWarnings ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';
  const headerBorder = isSkip ? 'rgba(239,68,68,0.3)' : hasWarnings ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)';

  const HeaderIcon = isSkip ? ShieldX : hasWarnings ? ShieldAlert : ShieldCheck;
  const headerLabel = isSkip ? '見送り' : hasWarnings ? '注意' : '買い';

  return (
    <motion.div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: headerBorder, backgroundColor: 'var(--bg-card)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-2">
          <HeaderIcon className="w-5 h-5" style={{ color: headerColor }} />
          <span className="font-bold" style={{ color: headerColor }}>
            {headerLabel}
          </span>
          <RaceGradeBadge grade={sc.raceGrade} />
        </div>
        {isSkip && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            確信度: {sc.confidence}%
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* 理由リスト */}
        {sc.reasons.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              {isSkip ? '見送り理由' : '注意点'}
            </h5>
            {sc.reasons.map((reason, i) => (
              <motion.div
                key={reason.code}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mt-0.5">
                  {reason.severity === '絶対見送り' ? (
                    <Ban className="w-4 h-4 text-red-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-yellow-400" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {reason.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {reason.detail}
                  </div>
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                  style={{
                    color: reason.severity === '絶対見送り' ? '#ef4444' : '#f59e0b',
                    backgroundColor: reason.severity === '絶対見送り' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  }}
                >
                  {reason.severity}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* モデル分離力 */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            モデル分離力
          </h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>複勝AI 1位</div>
              <div className="text-lg font-bold font-mono" style={{
                color: sc.details.showRateTop !== null && sc.details.showRateTop >= 0.70 ? '#22c55e' : '#ef4444'
              }}>
                {sc.details.showRateTop !== null ? `${(sc.details.showRateTop * 100).toFixed(0)}%` : '-'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>閾値70%</div>
            </div>
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>上位5頭の差</div>
              <div className="text-lg font-bold font-mono" style={{
                color: sc.details.showRateSpread !== null && sc.details.showRateSpread >= 0.10 ? '#22c55e' : '#ef4444'
              }}>
                {sc.details.showRateSpread !== null ? `${(sc.details.showRateSpread * 100).toFixed(1)}%` : '-'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>閾値10%</div>
            </div>
          </div>
        </div>

        {/* 消し対象 */}
        <div className="space-y-2">
          <h5 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <Ban className="w-3.5 h-3.5" />
            消し対象: {sc.eliminatedHorses.length}頭
          </h5>
          {sc.eliminatedHorses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sc.eliminatedHorses.map(num => {
                const horse = race.horses.find(h => h.number === num);
                const bracketColor = getBracketColor(num, race.horses.length);
                return (
                  <span
                    key={num}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <span
                      className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                      style={{
                        backgroundColor: bracketColor.bg,
                        color: bracketColor.text,
                        borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                      }}
                    >
                      {num}
                    </span>
                    <span className="text-[10px] truncate max-w-[48px]" style={{ color: 'var(--text-secondary)' }}>
                      {horse?.name.slice(0, 4) ?? ''}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 軸候補・相手候補（買いレースの場合のみ） */}
        {isBuy && (
          <>
            {sc.axisHorses.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Target className="w-3.5 h-3.5" />
                  軸候補
                </h5>
                <div className="space-y-1">
                  {sc.axisHorses.map(num => {
                    const horse = race.horses.find(h => h.number === num);
                    if (!horse) return null;
                    const bracketColor = getBracketColor(num, race.horses.length);
                    return (
                      <div
                        key={num}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <span
                          className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center border"
                          style={{
                            backgroundColor: bracketColor.bg,
                            color: bracketColor.text,
                            borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                          }}
                        >
                          {num}
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {horse.name}
                        </span>
                        <span className="ml-auto text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {horse.tanshoOdds.toFixed(1)}倍
                        </span>
                        <span
                          className="text-[10px] px-1 py-0.5 rounded font-bold"
                          style={{ color: horse.efficiency.color }}
                        >
                          {horse.efficiency.rank}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sc.partnerHorses.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Users className="w-3.5 h-3.5" />
                  相手候補
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {sc.partnerHorses.map(num => {
                    const horse = race.horses.find(h => h.number === num);
                    if (!horse) return null;
                    const bracketColor = getBracketColor(num, race.horses.length);
                    return (
                      <span
                        key={num}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <span
                          className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                          style={{
                            backgroundColor: bracketColor.bg,
                            color: bracketColor.text,
                            borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                          }}
                        >
                          {num}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{horse.name.slice(0, 5)}</span>
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {horse.tanshoOdds.toFixed(1)}倍
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* サマリー */}
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: headerBg,
            color: 'var(--text-primary)',
          }}
        >
          {sc.summary}
        </div>
      </div>
    </motion.div>
  );
}
