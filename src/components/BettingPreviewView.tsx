/**
 * 馬券プレビュー比較表示UIコンポーネント
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Race,
  OddsDisplay,
  Bet,
  RaceBets,
  CompareResult,
  FormationResult,
  FormationPattern,
  ScoredHorse,
  BettingConfig,
} from '../types';
import { useBettingPreview } from '../hooks/useBettingPreview';

interface BettingPreviewViewProps {
  race: Race;
  odds: OddsDisplay | null;
}

// ===== BettingConfigPanel =====
function BettingConfigPanel({
  config,
  onChange,
}: {
  config: BettingConfig;
  onChange: (config: BettingConfig) => void;
}) {
  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        金額設定
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>単勝</label>
          <input
            type="number"
            step={100}
            min={100}
            value={config.tanshoAmount}
            onChange={e => onChange({ ...config, tanshoAmount: Number(e.target.value) || 100 })}
            className="w-full px-2 py-1 rounded text-sm border font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>ワイド</label>
          <input
            type="number"
            step={100}
            min={100}
            value={config.wideAmount}
            onChange={e => onChange({ ...config, wideAmount: Number(e.target.value) || 100 })}
            className="w-full px-2 py-1 rounded text-sm border font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>馬連</label>
          <input
            type="number"
            step={100}
            min={100}
            value={config.umarenAmount}
            onChange={e => onChange({ ...config, umarenAmount: Number(e.target.value) || 100 })}
            className="w-full px-2 py-1 rounded text-sm border font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={config.skipLowOdds}
              onChange={e => onChange({ ...config, skipLowOdds: e.target.checked })}
              className="w-4 h-4 rounded text-blue-500"
            />
            低オッズスキップ
          </label>
        </div>
      </div>
    </div>
  );
}

// ===== CompareSummaryBar =====
function CompareSummaryBar({ compare }: { compare: CompareResult }) {
  const modes = [
    { key: 'normal' as const, label: '通常', color: 'bg-blue-500', data: compare.normal },
    { key: 'ura' as const, label: '裏', color: 'bg-orange-500', data: compare.ura },
    { key: 'bousou' as const, label: '暴走', color: 'bg-purple-500', data: compare.bousou },
  ];

  const totalAmount = modes.reduce((sum, m) => sum + (m.data?.totalAmount ?? 0), 0);
  const totalBets = modes.reduce((sum, m) => sum + (m.data?.bets.length ?? 0), 0);

  return (
    <div
      className="p-3 rounded-xl border flex items-center gap-4 flex-wrap"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {modes.map(m => (
        <div key={m.key} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${m.color}`} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {m.label}
          </span>
          <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {m.data ? `${m.data.totalAmount.toLocaleString()}円` : '-'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            ({m.data?.bets.length ?? 0}点)
          </span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>合計</span>
        <span className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
          {totalAmount.toLocaleString()}円
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          ({totalBets}点)
        </span>
      </div>
    </div>
  );
}

// ===== ModeColumn =====
function ModeColumn({
  label,
  colorClass,
  borderColorClass,
  raceBets,
}: {
  label: string;
  colorClass: string;
  borderColorClass: string;
  raceBets: RaceBets | null;
}) {
  if (!raceBets || raceBets.bets.length === 0) {
    return (
      <div
        className={`p-3 rounded-xl border-2 ${borderColorClass}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <h4 className={`text-sm font-bold mb-2 ${colorClass}`}>{label}</h4>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>該当なし</p>
      </div>
    );
  }

  const tansho = raceBets.bets.filter(b => b.type === '単勝');
  const wide = raceBets.bets.filter(b => b.type === 'ワイド');
  const umaren = raceBets.bets.filter(b => b.type === '馬連');

  return (
    <div
      className={`p-3 rounded-xl border-2 ${borderColorClass} space-y-3`}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-bold ${colorClass}`}>{label}</h4>
        <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
          {raceBets.totalAmount.toLocaleString()}円
        </span>
      </div>

      {tansho.length > 0 && (
        <BetSection title="単勝" bets={tansho} />
      )}
      {wide.length > 0 && (
        <BetSection title="ワイド" bets={wide} />
      )}
      {umaren.length > 0 && (
        <BetSection title="馬連" bets={umaren} />
      )}
    </div>
  );
}

function BetSection({ title, bets }: { title: string; bets: Bet[] }) {
  return (
    <div>
      <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
        {title} ({bets.length}点)
      </div>
      <div className="space-y-1">
        {bets.map((bet, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1 rounded text-xs"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                {bet.umaban}
                {bet.umaban2 > 0 && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {bet.type === 'ワイド' ? '→' : '='}{bet.umaban2}
                  </span>
                )}
              </span>
              <span className="truncate" style={{ color: 'var(--text-secondary)' }} title={bet.reason}>
                {bet.reason}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {bet.odds > 0 && (
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {bet.odds.toFixed(1)}x
                </span>
              )}
              <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {bet.amount}円
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ScoredHorsesRanking =====
function ScoredHorsesRanking({ scoredHorses }: { scoredHorses: ScoredHorse[] }) {
  if (scoredHorses.length === 0) return null;

  const rankColors: Record<string, string> = {
    S: 'bg-red-500',
    A: 'bg-orange-500',
    B: 'bg-blue-500',
    C: 'bg-gray-500',
  };

  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        統合スコアランキング
      </h3>
      <div className="flex flex-wrap gap-2">
        {scoredHorses.map(h => (
          <div
            key={h.umaban}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white ${rankColors[h.rank] ?? 'bg-gray-400'}`}>
              {h.rank}
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {h.umaban}
            </span>
            <span className="text-xs truncate max-w-[60px]" style={{ color: 'var(--text-primary)' }}>
              {h.name}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              Sc{h.score}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {h.modesCount}M
            </span>
            {h.normalScore > 0 && <span className="text-[10px] text-blue-400">通{h.normalScore}</span>}
            {h.uraScore > 0 && <span className="text-[10px] text-orange-400">裏{h.uraScore}</span>}
            {h.bousouScore > 0 && <span className="text-[10px] text-purple-400">暴{h.bousouScore}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== FormationCard =====
function FormationCard({ pattern, type }: { pattern: FormationPattern; type: '三連複' | '三連単' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="p-3 rounded-xl border"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{pattern.emoji}</span>
          <div className="min-w-0">
            <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
              {pattern.name}
            </span>
            <span className="text-[10px] block truncate" style={{ color: 'var(--text-secondary)' }}>
              {pattern.description}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {pattern.count}点
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
            {pattern.amount.toLocaleString()}円
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              {/* Formation columns */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {type === '三連複' ? '1列目' : '1着'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.col1.map(n => (
                      <span key={n} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-bold font-mono">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {type === '三連複' ? '2列目' : '2着'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.col2.map(n => (
                      <span key={n} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {type === '三連複' ? '3列目' : '3着'}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.col3.map(n => (
                      <span key={n} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Combos for sanrenpuku */}
              {type === '三連複' && pattern.combos && pattern.combos.length <= 30 && (
                <div>
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    組み合わせ一覧
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pattern.combos.map((combo, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        {combo.join('-')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== FormationSection =====
function FormationSection({ formations }: { formations: FormationResult }) {
  const [showSanrenpuku, setShowSanrenpuku] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <motion.button
          onClick={() => setShowSanrenpuku(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            showSanrenpuku ? 'bg-emerald-500 text-white' : 'border border-[var(--border)]'
          }`}
          style={{ color: showSanrenpuku ? undefined : 'var(--text-secondary)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          三連複 ({formations.sanrenpuku.length})
        </motion.button>
        <motion.button
          onClick={() => setShowSanrenpuku(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            !showSanrenpuku ? 'bg-emerald-500 text-white' : 'border border-[var(--border)]'
          }`}
          style={{ color: !showSanrenpuku ? undefined : 'var(--text-secondary)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          三連単 ({formations.sanrentan.length})
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {showSanrenpuku ? (
          <motion.div
            key="sanrenpuku"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-2"
          >
            {formations.sanrenpuku.length > 0 ? (
              formations.sanrenpuku.map((p, i) => (
                <FormationCard key={i} pattern={p} type="三連複" />
              ))
            ) : (
              <p className="text-xs p-3" style={{ color: 'var(--text-secondary)' }}>
                条件に合うパターンがありません
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="sanrentan"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-2"
          >
            {formations.sanrentan.length > 0 ? (
              formations.sanrentan.map((p, i) => (
                <FormationCard key={i} pattern={p} type="三連単" />
              ))
            ) : (
              <p className="text-xs p-3" style={{ color: 'var(--text-secondary)' }}>
                条件に合うパターンがありません
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== メインコンポーネント =====
export default function BettingPreviewView({ race, odds }: BettingPreviewViewProps) {
  const { config, setConfig, compareResult, formationResult } = useBettingPreview(race, odds);

  return (
    <div className="space-y-4">
      {/* Config Panel */}
      <BettingConfigPanel config={config} onChange={setConfig} />

      {/* Summary Bar */}
      {compareResult && <CompareSummaryBar compare={compareResult} />}

      {/* 3 Column Compare */}
      {compareResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ModeColumn
            label="通常モード"
            colorClass="text-blue-400"
            borderColorClass="border-blue-500/30"
            raceBets={compareResult.normal}
          />
          <ModeColumn
            label="裏モード"
            colorClass="text-orange-400"
            borderColorClass="border-orange-500/30"
            raceBets={compareResult.ura}
          />
          <ModeColumn
            label="暴走モード"
            colorClass="text-purple-400"
            borderColorClass="border-purple-500/30"
            raceBets={compareResult.bousou}
          />
        </div>
      )}

      {/* Scored Horses Ranking */}
      {formationResult && (
        <ScoredHorsesRanking scoredHorses={formationResult.scoredHorses} />
      )}

      {/* Formation Section */}
      {formationResult && (formationResult.sanrenpuku.length > 0 || formationResult.sanrentan.length > 0) && (
        <FormationSection formations={formationResult} />
      )}

      {/* Empty state */}
      {compareResult && !compareResult.normal && !compareResult.ura && !compareResult.bousou && (
        <div
          className="p-6 rounded-xl text-center"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            このレースでは購入対象がありません
          </p>
        </div>
      )}
    </div>
  );
}
