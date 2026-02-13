import { motion } from 'framer-motion';
import { Race } from '../../types';
import { RaceResult } from '../../types/raceResults';
import { useHorseMarksContext } from '../../contexts/HorseMarksContext';
import { MARK_COLORS } from '../../hooks/useHorseMarks';

interface RaceReviewProps {
  races: Race[];
  getResultByVenueRound: (venue: string, round: number) => RaceResult | undefined;
}

// Build finish order map from either RaceResultDisplay or RaceResult
function getFinishMap(race: Race, raw: RaceResult | undefined): Map<string, number> {
  const map = new Map<string, number>();

  if (race.result) {
    for (const f of race.result.finishOrder) {
      map.set(f.horseName, f.position);
    }
    return map;
  }

  if (raw) {
    for (const f of raw.data.着順 || []) {
      map.set(f.馬名, parseInt(f.着順, 10));
    }
  }
  return map;
}

export default function RaceReview({ races, getResultByVenueRound }: RaceReviewProps) {
  const { getMark } = useHorseMarksContext();

  const reviewableRaces = races
    .map(race => ({
      race,
      rawResult: getResultByVenueRound(race.location, race.round),
    }))
    .filter(r => r.race.result != null || r.rawResult != null);

  if (reviewableRaces.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
        結果が確定したレースがありません
      </div>
    );
  }

  // Aggregate mark accuracy stats
  const markStats: Record<string, { total: number; top3: number; win: number }> = {};

  for (const { race, rawResult } of reviewableRaces) {
    const finishMap = getFinishMap(race, rawResult);

    for (const horse of race.horses) {
      const mark = getMark(horse.name);
      if (!mark) continue;

      if (!markStats[mark]) {
        markStats[mark] = { total: 0, top3: 0, win: 0 };
      }
      markStats[mark].total++;

      const pos = finishMap.get(horse.name);
      if (pos === 1) {
        markStats[mark].win++;
        markStats[mark].top3++;
      } else if (pos !== undefined && pos <= 3) {
        markStats[mark].top3++;
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Mark Accuracy Summary */}
      {Object.keys(markStats).length > 0 && (
        <div>
          <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            印別的中率
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(markStats).map(([mark, stats]) => {
              const colors = MARK_COLORS[mark];
              const winRate = stats.total > 0 ? Math.round((stats.win / stats.total) * 100) : 0;
              const showRate = stats.total > 0 ? Math.round((stats.top3 / stats.total) * 100) : 0;
              return (
                <div
                  key={mark}
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: (colors?.bg || '#6b7280') + '20' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: colors?.bg || '#6b7280', color: colors?.text || '#fff' }}
                    >
                      {mark}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {colors?.label || mark} ({stats.total}頭)
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>勝率</span>
                      <span className="ml-1 font-bold font-mono" style={{ color: winRate > 0 ? '#22c55e' : 'var(--text-secondary)' }}>
                        {winRate}%
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>複勝率</span>
                      <span className="ml-1 font-bold font-mono" style={{ color: showRate > 0 ? '#3b82f6' : 'var(--text-secondary)' }}>
                        {showRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Race Review */}
      <div className="space-y-3">
        {reviewableRaces.map(({ race, rawResult }) => {
          const finishMap = getFinishMap(race, rawResult);

          const markedHorses = race.horses
            .filter(h => getMark(h.name))
            .map(h => ({
              horse: h,
              mark: getMark(h.name)!,
              position: finishMap.get(h.name) ?? null,
            }))
            .sort((a, b) => {
              const markOrder = ['◎', '◯', '▲', '△', '☆', '✕', '消'];
              return markOrder.indexOf(a.mark) - markOrder.indexOf(b.mark);
            });

          if (markedHorses.length === 0) return null;

          return (
            <motion.div
              key={race.id}
              className="p-3 rounded-xl border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {race.location}{race.round}R
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {race.name}
                </span>
              </div>

              <div className="space-y-1">
                {markedHorses.map(({ horse, mark, position }) => {
                  const colors = MARK_COLORS[mark];
                  const isHit = position !== null && position <= 3;
                  const isWin = position === 1;
                  return (
                    <div key={horse.id} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: colors?.bg || '#6b7280', color: colors?.text || '#fff' }}
                      >
                        {mark}
                      </span>
                      <span className="w-5 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {horse.number}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{horse.name}</span>
                      <span className="ml-auto flex items-center gap-1">
                        {position !== null ? (
                          <span
                            className="font-mono font-bold"
                            style={{ color: isWin ? '#f59e0b' : isHit ? '#22c55e' : 'var(--text-secondary)' }}
                          >
                            {position}着
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                        {isHit && (
                          <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            的中
                          </span>
                        )}
                      </span>
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
