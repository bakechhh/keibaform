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

// Normalize RaceResult into a simple format for display
interface NormalizedResult {
  finishOrder: { position: number; horseName: string; horseNum: number }[];
  tansho: number | null;
  sanrenpuku: number | null;
  sanrentan: number | null;
}

function normalizeResult(race: Race, raw: RaceResult | undefined): NormalizedResult | null {
  // Prefer race.result (RaceResultDisplay) if available
  if (race.result) {
    const r = race.result;
    return {
      finishOrder: r.finishOrder,
      tansho: r.payouts.tansho?.[0]?.payout ?? null,
      sanrenpuku: r.payouts.sanrenpuku?.[0]?.payout ?? null,
      sanrentan: r.payouts.sanrentan?.[0]?.payout ?? null,
    };
  }
  if (!raw) return null;

  const d = raw.data;
  return {
    finishOrder: (d.着順 || []).map(f => ({
      position: parseInt(f.着順, 10),
      horseName: f.馬名,
      horseNum: parseInt(f.馬番, 10),
    })),
    tansho: d.払戻?.単勝?.[0] ? parseInt(d.払戻.単勝[0].払出, 10) : null,
    sanrenpuku: d.払戻?.['3連複']?.[0] ? parseInt(d.払戻['3連複'][0].払出, 10) : null,
    sanrentan: d.払戻?.['3連単']?.[0] ? parseInt(d.払戻['3連単'][0].払出, 10) : null,
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

  let totalTansho = 0;
  let totalSanrenpuku = 0;
  let manbakenCount = 0;

  for (const { result } of racesWithResults) {
    if (result.tansho) totalTansho += result.tansho;
    if (result.sanrenpuku) {
      totalSanrenpuku += result.sanrenpuku;
      if (result.sanrenpuku >= 10000) manbakenCount++;
    }
    if (result.sanrentan && result.sanrentan >= 10000) manbakenCount++;
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
          const isManbakenSP = (result.sanrenpuku ?? 0) >= 10000;
          const isManbakenST = (result.sanrentan ?? 0) >= 10000;

          return (
            <motion.div
              key={race.id}
              className="p-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: (isManbakenSP || isManbakenST) ? '#ef444460' : 'var(--border)',
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

              {/* Payouts */}
              <div className="space-y-1 text-xs">
                {result.tansho != null && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>単勝</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatPayout(result.tansho)}
                    </span>
                  </div>
                )}
                {result.sanrenpuku != null && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>3連複</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: isManbakenSP ? '#ef4444' : 'var(--text-primary)' }}
                    >
                      {formatPayout(result.sanrenpuku)}
                      {isManbakenSP && ' !'}
                    </span>
                  </div>
                )}
                {result.sanrentan != null && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>3連単</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: isManbakenST ? '#ef4444' : 'var(--text-primary)' }}
                    >
                      {formatPayout(result.sanrentan)}
                      {isManbakenST && ' !'}
                    </span>
                  </div>
                )}
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
