/**
 * 馬券プレビュー比較表示UIコンポーネント
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Calculator, X, Check, Zap, CheckCircle, XCircle } from 'lucide-react';
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
import { calcFormationSyntheticOdds } from '../lib/synthetic-odds';
import { IchigekiEligibility } from '../lib/ichigeki-checker';
import { useIchigekiNotification } from '../hooks/useIchigekiNotification';

interface BettingPreviewViewProps {
  race: Race;
  odds: OddsDisplay | null;
}

// ===== 合成オッズ計算 =====
function calculateSyntheticOdds(bets: Bet[]): number | null {
  const validBets = bets.filter(b => b.odds > 0);
  if (validBets.length === 0) return null;
  const sum = validBets.reduce((acc, b) => acc + 1 / b.odds, 0);
  if (sum === 0) return null;
  return 1 / sum;
}

function syntheticOddsFromArray(oddsArr: number[]): number | null {
  const valid = oddsArr.filter(o => o > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, o) => acc + 1 / o, 0);
  if (sum === 0) return null;
  return 1 / sum;
}

// 合成オッズバッジ
function SyntheticOddsBadge({ odds }: { odds: number | null }) {
  if (odds === null) return null;
  const color = odds >= 2.0 ? 'text-emerald-400' : odds >= 1.0 ? 'text-amber-400' : 'text-red-400';
  return (
    <span className={`text-[10px] font-mono font-bold ${color}`}>
      合成{odds.toFixed(2)}倍
    </span>
  );
}

// ===== 資金配分ロジック =====

interface AllocationItem {
  label: string;
  odds: number;
  allocatedAmount: number;
  expectedPayout: number;
}

function calculateAllocation(
  items: { label: string; odds: number }[],
  budget: number,
): AllocationItem[] {
  const validItems = items.filter(i => i.odds > 0);
  if (validItems.length === 0 || budget <= 0) return [];

  const synOdds = syntheticOddsFromArray(validItems.map(i => i.odds));
  if (!synOdds) return [];

  // Step 1: Floor to 100 yen units (minimum 100 per item)
  const result = validItems.map(item => ({
    label: item.label,
    odds: item.odds,
    allocatedAmount: Math.max(100, Math.floor((budget * synOdds / item.odds) / 100) * 100),
    expectedPayout: 0,
  }));

  // Step 2: If total exceeds budget (due to min 100), reduce from lowest-odds items first
  let total = result.reduce((s, r) => s + r.allocatedAmount, 0);
  if (total > budget) {
    const byOddsAsc = [...result.keys()].sort((a, b) => result[a].odds - result[b].odds);
    for (const i of byOddsAsc) {
      while (total > budget && result[i].allocatedAmount > 100) {
        result[i].allocatedAmount -= 100;
        total -= 100;
      }
      if (total <= budget) break;
    }
  }

  // Step 3: Distribute remaining budget — add 100 to item with lowest expected payout
  let remaining = budget - total;
  while (remaining >= 100) {
    let minIdx = 0;
    let minPayout = result[0].allocatedAmount * result[0].odds;
    for (let i = 1; i < result.length; i++) {
      const p = result[i].allocatedAmount * result[i].odds;
      if (p < minPayout) {
        minPayout = p;
        minIdx = i;
      }
    }
    result[minIdx].allocatedAmount += 100;
    remaining -= 100;
  }

  // Step 4: Calculate expected payouts
  for (const r of result) {
    r.expectedPayout = Math.round(r.allocatedAmount * r.odds);
  }

  return result;
}

// フォーメーションの個別組み合わせ+オッズを取得
function getFormationItems(
  pattern: FormationPattern,
  type: '三連複' | '三連単',
  spOddsMap: Map<string, number>,
  stOddsMap: Map<string, number>,
): { label: string; odds: number }[] {
  if (type === '三連複') {
    const combos = pattern.combos;
    if (!combos) return [];
    return combos
      .map(combo => {
        const key = [...combo].sort((a, b) => a - b).join('-');
        const odds = spOddsMap.get(key);
        return odds ? { label: key, odds } : null;
      })
      .filter((x): x is { label: string; odds: number } => x !== null);
  } else {
    const items: { label: string; odds: number }[] = [];
    for (const a of pattern.col1) {
      for (const b of pattern.col2) {
        if (b === a) continue;
        for (const c of pattern.col3) {
          if (c === a || c === b) continue;
          const key = `${a}-${b}-${c}`;
          const odds = stOddsMap.get(key);
          if (odds) {
            items.push({ label: key, odds });
          }
        }
      }
    }
    return items;
  }
}

// ===== クリップボード用フォーマット =====

function formatModeBetsText(label: string, raceBets: RaceBets): string {
  const synOdds = calculateSyntheticOdds(raceBets.bets);
  let text = `【${label}】合計: ${raceBets.totalAmount.toLocaleString()}円 (${raceBets.bets.length}点)`;
  if (synOdds) text += ` 合成: ${synOdds.toFixed(2)}倍`;
  text += '\n';
  for (const bet of raceBets.bets) {
    let line = `${bet.type} ${bet.umaban}`;
    if (bet.umaban2 > 0) {
      line += bet.type === 'ワイド' ? `→${bet.umaban2}` : `=${bet.umaban2}`;
    }
    line += ` ${bet.amount}円`;
    if (bet.odds > 0) line += ` (${bet.odds.toFixed(1)}倍)`;
    if (bet.reason) line += ` [${bet.reason}]`;
    text += line + '\n';
  }
  return text.trim();
}

function formatFormationText(
  pattern: FormationPattern,
  type: '三連複' | '三連単',
  synOdds: number | null,
): string {
  let text = `【${type} ${pattern.name}】${pattern.count}点 ${pattern.amount.toLocaleString()}円`;
  if (synOdds) text += ` 合成: ${synOdds.toFixed(2)}倍`;
  text += '\n';
  const p1 = type === '三連複' ? '1列目' : '1着';
  const p2 = type === '三連複' ? '2列目' : '2着';
  const p3 = type === '三連複' ? '3列目' : '3着';
  text += `${p1}: ${pattern.col1.join(', ')}\n`;
  text += `${p2}: ${pattern.col2.join(', ')}\n`;
  text += `${p3}: ${pattern.col3.join(', ')}`;
  return text;
}

function formatAllocationText(
  title: string,
  budget: number,
  items: AllocationItem[],
): string {
  const total = items.reduce((s, i) => s + i.allocatedAmount, 0);
  let text = `【${title} 資金配分】予算: ${budget.toLocaleString()}円 → 合計: ${total.toLocaleString()}円\n`;
  for (const item of items) {
    text += `${item.label} ${item.allocatedAmount.toLocaleString()}円 (${item.odds.toFixed(1)}倍) → 的中時 ${item.expectedPayout.toLocaleString()}円\n`;
  }
  return text.trim();
}

// ===== 共通UIパーツ =====

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard API unavailable
        }
      }}
      className={`p-1 rounded transition-colors ${copied ? 'text-emerald-400' : 'hover:bg-white/10'}`}
      style={{ color: copied ? undefined : 'var(--text-secondary)' }}
      title={copied ? 'コピー済' : 'コピー'}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AllocateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="p-1 rounded hover:bg-white/10 transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      title="資金配分"
    >
      <Calculator className="w-3.5 h-3.5" />
    </button>
  );
}

// ===== 資金配分モーダル =====

function FundAllocationModal({
  title,
  items: rawItems,
  onClose,
}: {
  title: string;
  items: { label: string; odds: number }[];
  onClose: () => void;
}) {
  const [budget, setBudget] = useState(0);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCalculate = () => {
    if (budget <= 0) return;
    setAllocations(calculateAllocation(rawItems, budget));
  };

  const total = allocations.reduce((s, i) => s + i.allocatedAmount, 0);
  const minPayout = allocations.length > 0
    ? Math.min(...allocations.map(i => i.expectedPayout))
    : 0;
  const minReturnRate = total > 0 ? Math.round((minPayout / total) * 100) : 0;

  const handleCopy = async () => {
    const text = formatAllocationText(title, budget, allocations);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {title} 資金配分
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Budget input */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>
                予算 (円)
              </label>
              <input
                type="number"
                step={1000}
                min={rawItems.length * 100}
                value={budget || ''}
                onChange={e => setBudget(Number(e.target.value) || 0)}
                onKeyDown={e => { if (e.key === 'Enter') handleCalculate(); }}
                placeholder={`最低 ${(rawItems.length * 100).toLocaleString()}円`}
                className="w-full px-3 py-2 rounded-lg text-sm border font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <motion.button
              onClick={handleCalculate}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              配分計算
            </motion.button>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {rawItems.length}点 × 100円 = 最低 {(rawItems.length * 100).toLocaleString()}円
          </div>
        </div>

        {/* Results */}
        {allocations.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>
                  合計: <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                    {total.toLocaleString()}円
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  最低払戻: <span className="font-bold font-mono text-emerald-400">
                    {minPayout.toLocaleString()}円
                  </span>
                </span>
              </div>
              <span className={`text-xs font-bold ${minReturnRate >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                最低回収率: {minReturnRate}%
              </span>
            </div>

            {/* Allocation table */}
            <div className="space-y-1">
              {allocations.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2 py-1.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {item.odds.toFixed(1)}倍
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      {item.allocatedAmount.toLocaleString()}円
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400">
                      →{item.expectedPayout.toLocaleString()}円
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Copy button */}
            <motion.button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                copied ? 'bg-emerald-500/20 text-emerald-400' : 'border'
              }`}
              style={copied ? undefined : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'コピーしました' : '配分結果をコピー'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
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
      {modes.map(m => {
        const synOdds = m.data ? calculateSyntheticOdds(m.data.bets) : null;
        return (
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
            <SyntheticOddsBadge odds={synOdds} />
          </div>
        );
      })}
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
  onAllocate,
}: {
  label: string;
  colorClass: string;
  borderColorClass: string;
  raceBets: RaceBets | null;
  onAllocate: (title: string, items: { label: string; odds: number }[]) => void;
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
  const allSynOdds = calculateSyntheticOdds(raceBets.bets);
  const allocatableBets = raceBets.bets.filter(b => b.odds > 0);

  const handleAllocate = () => {
    const items = allocatableBets.map(b => ({
      label: `${b.type} ${b.umaban}${b.umaban2 > 0 ? (b.type === 'ワイド' ? '→' : '=') + b.umaban2 : ''}`,
      odds: b.odds,
    }));
    onAllocate(label, items);
  };

  return (
    <div
      className={`p-3 rounded-xl border-2 ${borderColorClass} space-y-3`}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold ${colorClass}`}>{label}</h4>
          <SyntheticOddsBadge odds={allSynOdds} />
        </div>
        <div className="flex items-center gap-1">
          <CopyButton getText={() => formatModeBetsText(label, raceBets)} />
          {allocatableBets.length > 0 && (
            <AllocateButton onClick={handleAllocate} />
          )}
          <span className="text-xs font-mono font-bold ml-1" style={{ color: 'var(--text-primary)' }}>
            {raceBets.totalAmount.toLocaleString()}円
          </span>
        </div>
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
  const synOdds = calculateSyntheticOdds(bets);
  const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            {title} ({bets.length}点)
          </span>
          <SyntheticOddsBadge odds={synOdds} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
          計{totalAmount.toLocaleString()}円
        </span>
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

// ===== 一撃判定パネル =====
function IchigekiEligibilityPanel({ eligibility }: { eligibility: IchigekiEligibility }) {
  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: eligibility.eligible ? 'rgb(234 179 8 / 0.4)' : 'var(--border)' }}
    >
      {/* 合格バナー */}
      {eligibility.eligible && (
        <motion.div
          className="flex items-center gap-2 p-3 rounded-lg border"
          style={{ backgroundColor: 'rgb(234 179 8 / 0.1)', borderColor: 'rgb(234 179 8 / 0.3)' }}
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">一撃対象レース</span>
        </motion.div>
      )}

      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Zap className="w-4 h-4 text-yellow-400" />
        一撃購入条件チェック
      </h3>

      <div className="space-y-1.5">
        {eligibility.conditions.map((cond, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {cond.passed ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold"
                  style={{ color: cond.passed ? 'var(--text-primary)' : 'rgb(248 113 113)' }}
                >
                  {cond.label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {cond.threshold}
                </span>
              </div>
              <span
                className="text-[10px]"
                style={{ color: cond.passed ? 'rgb(52 211 153)' : 'rgb(248 113 113)' }}
              >
                {cond.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 合成オッズサマリー =====
function SyntheticOddsSummary({ eligibility }: { eligibility: IchigekiEligibility }) {
  const spOdds = eligibility.avgSanrenpukuSynOdds;
  const stOdds = eligibility.avgSanrentanSynOdds;

  const spInRange = spOdds !== null && spOdds <= 5.0;
  const stInRange = stOdds !== null && stOdds >= 10.0 && stOdds <= 25.0;

  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        合成オッズ分析（一撃以外の平均）
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: spInRange ? 'rgb(52 211 153 / 0.3)' : 'rgb(248 113 113 / 0.3)',
          }}
        >
          <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            三連複平均
          </div>
          <div className={`text-lg font-bold font-mono ${spInRange ? 'text-emerald-400' : 'text-red-400'}`}>
            {spOdds !== null ? `${spOdds.toFixed(2)}倍` : '-'}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            閾値: &lt;= 5.0
          </div>
        </div>
        <div
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: stInRange ? 'rgb(52 211 153 / 0.3)' : 'rgb(248 113 113 / 0.3)',
          }}
        >
          <div className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            三連単平均
          </div>
          <div className={`text-lg font-bold font-mono ${stInRange ? 'text-emerald-400' : 'text-red-400'}`}>
            {stOdds !== null ? `${stOdds.toFixed(2)}倍` : '-'}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            閾値: 10.0 〜 25.0
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 一撃トースト通知 =====
function IchigekiToastBanner({
  raceName,
  onDismiss,
}: {
  raceName: string;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border"
      style={{
        backgroundColor: 'rgb(234 179 8 / 0.15)',
        borderColor: 'rgb(234 179 8 / 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Zap className="w-5 h-5 text-yellow-400" />
      <span className="text-sm font-bold text-yellow-400">
        {raceName} 一撃対象レース検出!
      </span>
      <button onClick={onDismiss} className="ml-2 p-1 rounded hover:bg-white/10">
        <X className="w-3 h-3 text-yellow-400" />
      </button>
    </motion.div>
  );
}

// ===== FormationCard =====
function FormationCard({
  pattern, type, spOddsMap, stOddsMap, onAllocate, ichigekiEligible,
}: {
  pattern: FormationPattern;
  type: '三連複' | '三連単';
  spOddsMap: Map<string, number>;
  stOddsMap: Map<string, number>;
  onAllocate: (title: string, items: { label: string; odds: number }[]) => void;
  ichigekiEligible?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const synOdds = calcFormationSyntheticOdds(pattern, type, spOddsMap, stOddsMap);
  const formItems = getFormationItems(pattern, type, spOddsMap, stOddsMap);

  const isIchigeki = pattern.name.includes('一撃');
  const ichigekiBorderColor = isIchigeki
    ? ichigekiEligible ? 'rgb(234 179 8 / 0.5)' : 'rgb(107 114 128 / 0.4)'
    : 'var(--border)';

  return (
    <div
      className={`p-3 rounded-xl border${isIchigeki ? ' border-2' : ''}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: ichigekiBorderColor }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{pattern.emoji}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {pattern.name}
              </span>
              <SyntheticOddsBadge odds={synOdds} />
              {isIchigeki && (
                ichigekiEligible ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    対象
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                    条件未達
                  </span>
                )
              )}
            </div>
            <span className="text-[10px] block truncate" style={{ color: 'var(--text-secondary)' }}>
              {pattern.description}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <div className="flex items-center" onClick={e => e.stopPropagation()}>
            <CopyButton getText={() => formatFormationText(pattern, type, synOdds)} />
            {formItems.length > 0 && (
              <AllocateButton onClick={() => onAllocate(`${type} ${pattern.name}`, formItems)} />
            )}
          </div>
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
      </div>

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
function FormationSection({
  formations, spOddsMap, stOddsMap, onAllocate, ichigekiEligible,
}: {
  formations: FormationResult;
  spOddsMap: Map<string, number>;
  stOddsMap: Map<string, number>;
  onAllocate: (title: string, items: { label: string; odds: number }[]) => void;
  ichigekiEligible?: boolean;
}) {
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
                <FormationCard key={i} pattern={p} type="三連複" spOddsMap={spOddsMap} stOddsMap={stOddsMap} onAllocate={onAllocate} ichigekiEligible={ichigekiEligible} />
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
                <FormationCard key={i} pattern={p} type="三連単" spOddsMap={spOddsMap} stOddsMap={stOddsMap} onAllocate={onAllocate} ichigekiEligible={ichigekiEligible} />
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
  const {
    config, setConfig, compareResult, formationResult,
    ichigekiEligibility, spOddsMap, stOddsMap,
  } = useBettingPreview(race, odds);

  // 一撃通知
  const { toast, dismissToast } = useIchigekiNotification(ichigekiEligibility, race);

  // 資金配分モーダル
  const [allocationTarget, setAllocationTarget] = useState<{
    title: string;
    items: { label: string; odds: number }[];
  } | null>(null);

  return (
    <div className="space-y-4">
      {/* 一撃トースト通知 */}
      <AnimatePresence>
        {toast.show && (
          <IchigekiToastBanner raceName={toast.raceName} onDismiss={dismissToast} />
        )}
      </AnimatePresence>

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
            onAllocate={(title, items) => setAllocationTarget({ title, items })}
          />
          <ModeColumn
            label="裏モード"
            colorClass="text-orange-400"
            borderColorClass="border-orange-500/30"
            raceBets={compareResult.ura}
            onAllocate={(title, items) => setAllocationTarget({ title, items })}
          />
          <ModeColumn
            label="暴走モード"
            colorClass="text-purple-400"
            borderColorClass="border-purple-500/30"
            raceBets={compareResult.bousou}
            onAllocate={(title, items) => setAllocationTarget({ title, items })}
          />
        </div>
      )}

      {/* Scored Horses Ranking */}
      {formationResult && (
        <ScoredHorsesRanking scoredHorses={formationResult.scoredHorses} />
      )}

      {/* 一撃判定パネル + 合成オッズ分析 */}
      {ichigekiEligibility && (
        <>
          <IchigekiEligibilityPanel eligibility={ichigekiEligibility} />
          <SyntheticOddsSummary eligibility={ichigekiEligibility} />
        </>
      )}

      {/* Formation Section */}
      {formationResult && (formationResult.sanrenpuku.length > 0 || formationResult.sanrentan.length > 0) && (
        <FormationSection
          formations={formationResult}
          spOddsMap={spOddsMap}
          stOddsMap={stOddsMap}
          onAllocate={(title, items) => setAllocationTarget({ title, items })}
          ichigekiEligible={ichigekiEligibility?.eligible}
        />
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

      {/* Fund Allocation Modal */}
      <AnimatePresence>
        {allocationTarget && (
          <FundAllocationModal
            title={allocationTarget.title}
            items={allocationTarget.items}
            onClose={() => setAllocationTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
