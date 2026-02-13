import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Race } from '../../types';
import { IchigekiScanResult } from '../../hooks/useIchigekiScan';

interface CrossRaceComparisonProps {
  races: Race[];
  ichigekiScanResults: IchigekiScanResult[];
  onRaceSelect: (race: Race) => void;
}

type SortKey = 'name' | 'horses' | 'favOdds' | 'evaluation' | 'ichigeki' | 'surface' | 'distance';

const evalOrder: Record<string, number> = {
  SUPER: 0, GOOD: 1, SOLID: 2, CHAOS: 3, NORMAL: 4, KEN: 5,
};

const ichigekiLevelOrder: Record<string, number> = {
  eligible: 0,
  semi: 1,
  ineligible: 2,
};

export default function CrossRaceComparison({ races, ichigekiScanResults, onRaceSelect }: CrossRaceComparisonProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Build ichigeki map for quick lookup
  const ichigekiMap = new Map<string, IchigekiScanResult>();
  for (const r of ichigekiScanResults) {
    ichigekiMap.set(r.race.id, r);
  }

  const raceData = races.map(race => {
    const favHorse = race.horses.reduce(
      (min, h) => (h.tanshoOdds > 0 && h.tanshoOdds < min.tanshoOdds) ? h : min,
      race.horses[0],
    );
    const ichigeki = ichigekiMap.get(race.id);
    return {
      race,
      horsesCount: race.horses.length,
      favOdds: favHorse?.tanshoOdds ?? 0,
      evalType: race.evaluation.type,
      ichigeki,
    };
  });

  const sorted = [...raceData].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = `${a.race.location}${String(a.race.round).padStart(2, '0')}`.localeCompare(
          `${b.race.location}${String(b.race.round).padStart(2, '0')}`
        );
        break;
      case 'horses':
        cmp = a.horsesCount - b.horsesCount;
        break;
      case 'favOdds':
        cmp = a.favOdds - b.favOdds;
        break;
      case 'evaluation':
        cmp = (evalOrder[a.evalType] ?? 99) - (evalOrder[b.evalType] ?? 99);
        break;
      case 'ichigeki': {
        const aLevel = a.ichigeki ? ichigekiLevelOrder[a.ichigeki.level] ?? 99 : 99;
        const bLevel = b.ichigeki ? ichigekiLevelOrder[b.ichigeki.level] ?? 99 : 99;
        cmp = aLevel - bLevel;
        break;
      }
      case 'surface':
        cmp = a.race.surface.localeCompare(b.race.surface);
        break;
      case 'distance':
        cmp = a.race.distance - b.race.distance;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const SortHeader = ({ label, k, className: cn }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={`py-2 px-2 text-left cursor-pointer hover:text-emerald-400 transition-colors select-none whitespace-nowrap ${cn || ''}`}
      style={{ color: sortKey === k ? '#10b981' : 'var(--text-secondary)' }}
      onClick={() => handleSort(k)}
    >
      {label} {sortKey === k && (sortAsc ? '\u25B2' : '\u25BC')}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <SortHeader label="レース" k="name" />
            <SortHeader label="馬場" k="surface" />
            <SortHeader label="距離" k="distance" />
            <SortHeader label="頭数" k="horses" />
            <SortHeader label="1人気" k="favOdds" />
            <SortHeader label="評価" k="evaluation" />
            <SortHeader label="一撃" k="ichigeki" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ race, horsesCount, favOdds, ichigeki }) => {
            const isIchigeki = ichigeki && ichigeki.level !== 'ineligible';
            const isEligible = ichigeki?.level === 'eligible' && !ichigeki.eligibility.weak;
            const isSemi = ichigeki?.level === 'semi';
            const isWeak = ichigeki?.eligibility.weak && ichigeki.level !== 'ineligible';

            return (
              <motion.tr
                key={race.id}
                className={`border-b cursor-pointer transition-colors ${
                  isEligible ? 'hover:bg-yellow-500/10' :
                  isSemi ? 'hover:bg-blue-500/10' :
                  'hover:bg-emerald-500/5'
                }`}
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: isEligible ? 'rgb(234 179 8 / 0.04)' :
                    isSemi ? 'rgb(59 130 246 / 0.03)' : undefined,
                }}
                onClick={() => onRaceSelect(race)}
                whileHover={{ x: 4 }}
              >
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5">
                    {isIchigeki && (
                      <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isEligible ? 'text-yellow-400' :
                        isSemi ? 'text-blue-400' :
                        'text-gray-400'
                      }`} />
                    )}
                    <div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {race.location}{race.round}R
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {race.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                  {race.surface}
                </td>
                <td className="py-2 px-2 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                  {race.distance}m
                </td>
                <td className="py-2 px-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                  {horsesCount}
                </td>
                <td className="py-2 px-2 font-mono font-bold" style={{ color: favOdds >= 3.0 ? '#f59e0b' : '#22c55e' }}>
                  {favOdds.toFixed(1)}
                </td>
                <td className="py-2 px-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: race.evaluation.bg,
                      color: race.evaluation.color,
                    }}
                  >
                    {race.evaluation.label}
                  </span>
                </td>
                <td className="py-2 px-2">
                  {isEligible && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                      対象
                    </span>
                  )}
                  {isSemi && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                      準
                    </span>
                  )}
                  {isWeak && !isSemi && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400">
                      弱
                    </span>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
