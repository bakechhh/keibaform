import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, ClipboardList } from 'lucide-react';
import { Race } from '../../types';

interface DailySkipSummaryProps {
  races: Race[];
  onRaceSelect: (race: Race) => void;
}

export default function DailySkipSummary({ races, onRaceSelect }: DailySkipSummaryProps) {
  const racesWithCheck = races.filter(r => r.skipCheck);

  if (racesWithCheck.length === 0) return null;

  const buyRaces = racesWithCheck.filter(r => !r.skipCheck!.shouldSkip);
  const skipRaces = racesWithCheck.filter(r => r.skipCheck!.shouldSkip);

  const gradeGroups = {
    '最良': buyRaces.filter(r => r.skipCheck!.raceGrade === '最良'),
    '良い': buyRaces.filter(r => r.skipCheck!.raceGrade === '良い'),
    '普通': buyRaces.filter(r => r.skipCheck!.raceGrade === '普通'),
  };

  return (
    <motion.div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            見送りチェック
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            買い: {buyRaces.length}
          </span>
          <span className="flex items-center gap-1">
            <ShieldX className="w-3.5 h-3.5 text-red-400" />
            見送り: {skipRaces.length}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* 買いレース（グレード順） */}
        {(['最良', '良い', '普通'] as const).map(grade => {
          const group = gradeGroups[grade];
          if (group.length === 0) return null;

          const gradeConfig: Record<string, { color: string; bg: string }> = {
            '最良': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            '良い': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
            '普通': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          };
          const gc = gradeConfig[grade];

          return (
            <div key={grade}>
              <div className="text-[10px] font-bold mb-1.5" style={{ color: gc.color }}>
                {grade}
              </div>
              <div className="space-y-1">
                {group.map(race => {
                  const sc = race.skipCheck!;
                  // 軸馬の情報
                  const axisHorse = sc.axisHorses.length > 0
                    ? race.horses.find(h => h.number === sc.axisHorses[0])
                    : null;

                  return (
                    <motion.button
                      key={race.id}
                      onClick={() => onRaceSelect(race)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:brightness-110"
                      style={{ backgroundColor: gc.bg }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: gc.color }} />
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {race.location}{race.round}R
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {race.name}
                      </span>
                      {axisHorse && (
                        <span className="ml-auto text-xs font-mono flex-shrink-0" style={{ color: gc.color }}>
                          軸:{axisHorse.number}番 {axisHorse.tanshoOdds.toFixed(1)}倍
                        </span>
                      )}
                      {sc.reasons.length > 0 && (
                        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 見送りレース */}
        {skipRaces.length > 0 && (
          <div>
            <div className="text-[10px] font-bold mb-1.5 text-red-400">
              見送り
            </div>
            <div className="space-y-1">
              {skipRaces.map(race => {
                const sc = race.skipCheck!;
                const mainReason = sc.reasons.find(r => r.severity === '絶対見送り');

                return (
                  <motion.button
                    key={race.id}
                    onClick={() => onRaceSelect(race)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                    style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <ShieldX className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {race.location}{race.round}R
                    </span>
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {mainReason?.label ?? '見送り'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
