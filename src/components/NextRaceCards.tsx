import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { Race } from '../types';
import { SkipBadge } from './SkipChecker';

interface NextRaceCardsProps {
  races: Race[];
  onSelect: (race: Race) => void;
  onVenueSelect: (venue: string) => void;
}

function getMinutesUntil(startTime: string): number {
  const now = new Date();
  const [h, m] = startTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
}

function formatRemaining(minutes: number): string {
  if (minutes <= 0) return '発走済み';
  if (minutes < 60) return `あと${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `あと${h}時間${m}分` : `あと${h}時間`;
}

export default function NextRaceCards({ races, onSelect, onVenueSelect }: NextRaceCardsProps) {
  const [now, setNow] = useState(new Date());

  // 1分ごとに現在時刻を更新
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 各開催場所ごとの次のレースを計算
  const nextRaces = useMemo(() => {
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 開催場所ごとにグループ化
    const venueMap = new Map<string, Race[]>();
    for (const race of races) {
      if (!race.startTime) continue;
      const existing = venueMap.get(race.location) || [];
      existing.push(race);
      venueMap.set(race.location, existing);
    }

    const result: Race[] = [];
    for (const [, venueRaces] of venueMap) {
      // startTimeでソート
      const sorted = venueRaces
        .filter(r => r.startTime)
        .sort((a, b) => a.startTime!.localeCompare(b.startTime!));

      // 現在時刻以降の最初のレース
      const next = sorted.find(r => r.startTime! >= nowHHMM);
      if (next) {
        result.push(next);
      }
    }

    // 発走時刻順にソート
    return result.sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  }, [races, now]);

  if (nextRaces.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
      {nextRaces.map((race) => {
        const minutes = getMinutesUntil(race.startTime!);
        const isImminent = minutes >= 0 && minutes <= 10;
        const isPast = minutes < 0;

        return (
          <motion.button
            key={race.id}
            onClick={() => {
              onSelect(race);
              onVenueSelect(race.location);
            }}
            className={`
              flex-shrink-0 w-48 p-3 rounded-xl border-2 text-left transition-all
              ${isImminent
                ? 'border-red-400/60 bg-red-500/5'
                : 'border-[var(--border)] hover:border-emerald-400/50'
              }
            `}
            style={{ backgroundColor: 'var(--bg-card)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 開催場所 */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {race.location}
              </span>
              <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            </div>

            {/* レース番号 + 名前 */}
            <div className="font-bold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
              {race.round}R {race.name}
            </div>

            {/* 発走時刻 + 残り時間 */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className={`w-3.5 h-3.5 ${isImminent ? 'text-red-400' : isPast ? 'text-gray-400' : 'text-emerald-400'}`} />
              <span
                className={`text-sm font-mono font-bold ${isImminent ? 'text-red-400' : ''}`}
                style={{ color: isImminent ? undefined : 'var(--text-primary)' }}
              >
                {race.startTime}
              </span>
              <span
                className={`text-xs ${isImminent ? 'text-red-400 font-bold' : ''}`}
                style={{ color: isImminent ? undefined : 'var(--text-secondary)' }}
              >
                {formatRemaining(minutes)}
              </span>
            </div>

            {/* バッジ */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {race.evaluation && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: race.evaluation.color }}
                >
                  {race.evaluation.label}
                </span>
              )}
              <SkipBadge race={race} />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
