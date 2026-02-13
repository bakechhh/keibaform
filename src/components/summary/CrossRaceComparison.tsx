import { useState } from 'react';
import { motion } from 'framer-motion';
import { Race } from '../../types';

interface CrossRaceComparisonProps {
  races: Race[];
  onRaceSelect: (race: Race) => void;
}

type SortKey = 'name' | 'horses' | 'favOdds' | 'evaluation';

const evalOrder: Record<string, number> = {
  SUPER: 0, GOOD: 1, SOLID: 2, CHAOS: 3, NORMAL: 4, KEN: 5,
};

export default function CrossRaceComparison({ races, onRaceSelect }: CrossRaceComparisonProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const raceData = races.map(race => {
    const favHorse = race.horses.reduce(
      (min, h) => (h.tanshoOdds > 0 && h.tanshoOdds < min.tanshoOdds) ? h : min,
      race.horses[0],
    );
    return {
      race,
      horsesCount: race.horses.length,
      favOdds: favHorse?.tanshoOdds ?? 0,
      evalType: race.evaluation.type,
    };
  });

  const sorted = [...raceData].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = `${a.race.location}${a.race.round}`.localeCompare(`${b.race.location}${b.race.round}`);
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

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="py-2 px-2 text-left cursor-pointer hover:text-emerald-400 transition-colors select-none"
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
            <SortHeader label="頭数" k="horses" />
            <SortHeader label="1人気オッズ" k="favOdds" />
            <SortHeader label="レース評価" k="evaluation" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ race, horsesCount, favOdds }) => (
            <motion.tr
              key={race.id}
              className="border-b cursor-pointer hover:bg-emerald-500/5 transition-colors"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => onRaceSelect(race)}
              whileHover={{ x: 4 }}
            >
              <td className="py-2 px-2">
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {race.location}{race.round}R
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {race.name} {race.surface}{race.distance}m
                </div>
              </td>
              <td className="py-2 px-2 font-mono" style={{ color: 'var(--text-primary)' }}>
                {horsesCount}頭
              </td>
              <td className="py-2 px-2 font-mono font-bold" style={{ color: favOdds >= 3.0 ? '#f59e0b' : '#22c55e' }}>
                {favOdds.toFixed(1)}倍
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
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
