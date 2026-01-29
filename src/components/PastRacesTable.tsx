import { motion } from 'framer-motion';
import { PastRace } from '../types';

interface PastRacesTableProps {
  pastRaces: PastRace[];
}

const getPositionColor = (position: number | string): string => {
  const pos = typeof position === 'string' ? parseInt(position, 10) : position;
  if (isNaN(pos)) return 'var(--text-secondary)';
  if (pos === 1) return '#f59e0b'; // gold
  if (pos === 2) return '#71717a'; // silver (zinc-500 - 両モードで見やすい)
  if (pos === 3) return '#cd7f32'; // bronze
  if (pos <= 5) return '#22c55e'; // green
  return 'var(--text-secondary)';
};

const getSurfaceLabel = (surface: string): string => {
  if (surface.includes('芝')) return '芝';
  if (surface.includes('ダ')) return 'ダ';
  return surface;
};

const getConditionColor = (condition: string): string => {
  switch (condition) {
    case '良': return '#22c55e';
    case '稍': case '稍重': return '#eab308';
    case '重': return '#f97316';
    case '不': case '不良': return '#ef4444';
    default: return 'var(--text-secondary)';
  }
};

const getRunningStyleLabel = (style: string): string => {
  const styleMap: Record<string, string> = {
    '逃げ': '逃',
    '先行': '先',
    '差し': '差',
    '追込': '追',
    '追い込み': '追',
    'マ': 'マ',
  };
  return styleMap[style] || style.slice(0, 1);
};

export default function PastRacesTable({ pastRaces }: PastRacesTableProps) {
  if (pastRaces.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
        過去走データがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <th className="py-2 px-1 text-left font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>日付</th>
            <th className="py-2 px-1 text-left font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>レース</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>場所</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>馬場</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>距離</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>枠</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>番</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>斤量</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>着</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>着差</th>
            <th className="py-2 px-1 text-center font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>脚質</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>上3F</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>平3F</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>3F差</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>PCI</th>
            <th className="py-2 px-1 text-right font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>補正T</th>
          </tr>
        </thead>
        <tbody>
          {pastRaces.map((race, index) => (
            <motion.tr
              key={index}
              className="border-b hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-2 px-1 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                {race.date}
              </td>
              <td className="py-2 px-1" style={{ color: 'var(--text-primary)' }}>
                <span className="truncate max-w-[100px] inline-block" title={race.raceName}>
                  {race.raceName}
                </span>
              </td>
              <td className="py-2 px-1 text-center whitespace-nowrap font-medium" style={{ color: 'var(--text-primary)' }}>
                {race.place}
              </td>
              <td className="py-2 px-1 text-center">
                <span className="inline-flex items-center gap-0.5">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {getSurfaceLabel(race.surface)}
                  </span>
                  <span
                    className="text-xs px-0.5 rounded"
                    style={{
                      color: getConditionColor(race.condition),
                      backgroundColor: `${getConditionColor(race.condition)}20`,
                    }}
                  >
                    {race.condition}
                  </span>
                </span>
              </td>
              <td className="py-2 px-1 text-right font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                {race.distance}
              </td>
              <td className="py-2 px-1 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                {race.frame || '-'}
              </td>
              <td className="py-2 px-1 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>
                {race.horseNumber || '-'}
              </td>
              <td className="py-2 px-1 text-center font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                {race.weight}{race.weightReduction && <span className="text-xs text-red-400">{race.weightReduction}</span>}
              </td>
              <td className="py-2 px-1 text-center">
                <span
                  className="font-bold text-base"
                  style={{ color: getPositionColor(race.position) }}
                >
                  {race.position}
                </span>
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                {race.margin !== 0 ? race.margin.toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1 text-center">
                <span
                  className="inline-block w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {getRunningStyleLabel(race.runningStyle)}
                </span>
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: '#22c55e' }}>
                {race.last3f.toFixed(1)}
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                {race.ave3f.toFixed(1)}
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: race.position3f < 0 ? '#22c55e' : race.position3f > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                {race.position3f !== 0 ? race.position3f.toFixed(1) : '-'}
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: '#8b5cf6' }}>
                {race.pci.toFixed(1)}
              </td>
              <td className="py-2 px-1 text-right font-mono" style={{ color: '#f59e0b' }}>
                {race.correctedTime.toFixed(0)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
