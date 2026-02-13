import { motion } from 'framer-motion';
import { Race } from '../../types';
import { RaceResult } from '../../types/raceResults';

interface TodaysPayoutsProps {
  races: Race[];
  getResultByVenueRound: (venue: string, round: number) => RaceResult | undefined;
}

function formatPayout(amount: number): string {
  return amount.toLocaleString() + '円';
}

// Payout line: label + combination + amount
interface PayoutLine {
  label: string;
  combination: string;
  amount: number;
}

// Normalized result with ALL payout types
interface NormalizedResult {
  finishOrder: { position: number; horseName: string; horseNum: number }[];
  payouts: PayoutLine[];
}

const payoutTypeMap: [keyof import('../../types').RaceResultDisplay['payouts'], string][] = [
  ['tansho', '単勝'],
  ['fukusho', '複勝'],
  ['wakuren', '枠連'],
  ['umaren', '馬連'],
  ['umatan', '馬単'],
  ['wide', 'ワイド'],
  ['sanrenpuku', '3連複'],
  ['sanrentan', '3連単'],
];

const rawPayoutKeys: [string, string][] = [
  ['単勝', '単勝'],
  ['複勝', '複勝'],
  ['枠連', '枠連'],
  ['馬連', '馬連'],
  ['馬単', '馬単'],
  ['ワイド', 'ワイド'],
  ['3連複', '3連複'],
  ['3連単', '3連単'],
];

function normalizeResult(race: Race, raw: RaceResult | undefined): NormalizedResult | null {
  // Prefer race.result (RaceResultDisplay) if available
  if (race.result) {
    const r = race.result;
    const payouts: PayoutLine[] = [];
    for (const [key, label] of payoutTypeMap) {
      const items = r.payouts[key];
      if (items) {
        for (const item of items) {
          payouts.push({ label, combination: item.combination, amount: item.payout });
        }
      }
    }
    return { finishOrder: r.finishOrder, payouts };
  }
  if (!raw) return null;

  const d = raw.data;
  const payouts: PayoutLine[] = [];
  for (const [jpKey, label] of rawPayoutKeys) {
    const items = (d.払戻 as unknown as Record<string, { 払出: string; 組み合わせ: string }[] | undefined>)[jpKey];
    if (items) {
      for (const item of items) {
        payouts.push({ label, combination: item.組み合わせ, amount: parseInt(item.払出, 10) || 0 });
      }
    }
  }

  return {
    finishOrder: (d.着順 || []).map(f => ({
      position: parseInt(f.着順, 10),
      horseName: f.馬名,
      horseNum: parseInt(f.馬番, 10),
    })),
    payouts,
  };
}

export default function TodaysPayouts({ races, getResultByVenueRound }: TodaysPayoutsProps) {
  const racesWithResults = races
    .map(race => ({
      race,
      result: normalizeResult(race, getResultByVenueRound(race.location, race.round)),
    }))
    .filter((r): r is { race: Race; result: NormalizedResult } => r.result != null);

  if (racesWithResults.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
        確定済みのレース結果がありません
      </div>
    );
  }

  // Aggregate stats
  let totalTansho = 0;
  let totalSanrenpuku = 0;
  let manbakenCount = 0;

  for (const { result } of racesWithResults) {
    for (const p of result.payouts) {
      if (p.label === '単勝') totalTansho += p.amount;
      if (p.label === '3連複') totalSanrenpuku += p.amount;
      if ((p.label === '3連複' || p.label === '3連単') && p.amount >= 10000) manbakenCount++;
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SumCard label="確定レース" value={`${racesWithResults.length}R`} color="#22c55e" />
        <SumCard label="単勝合計" value={formatPayout(totalTansho)} color="#3b82f6" />
        <SumCard label="3連複合計" value={formatPayout(totalSanrenpuku)} color="#8b5cf6" />
        <SumCard label="万馬券" value={`${manbakenCount}回`} color="#ef4444" />
      </div>

      {/* Race Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {racesWithResults.map(({ race, result }) => {
          const hasManba = result.payouts.some(p =>
            (p.label === '3連複' || p.label === '3連単') && p.amount >= 10000
          );

          return (
            <motion.div
              key={race.id}
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: hasManba ? '#ef444460' : 'var(--border)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {race.location}{race.round}R
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {race.surface}{race.distance}m
                </span>
              </div>

              {/* Finish order top 3 */}
              <div className="flex items-center gap-2 mb-2 text-xs">
                {result.finishOrder.slice(0, 3).map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {f.position}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{f.horseNum}</span>
                  </span>
                ))}
              </div>

              {/* All Payouts */}
              <div className="space-y-0.5 text-xs">
                {result.payouts.map((p, i) => {
                  const isManba = p.amount >= 10000;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {p.combination}
                        </span>
                        <span
                          className="font-mono font-bold"
                          style={{ color: isManba ? '#ef4444' : 'var(--text-primary)' }}
                        >
                          {formatPayout(p.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SumCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ backgroundColor: color + '15' }}>
      <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}
