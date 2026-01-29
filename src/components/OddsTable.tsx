import { motion } from 'framer-motion';
import { OddsDisplay } from '../types';

type OddsType = 'tansho' | 'fukusho' | 'wakuren' | 'umaren' | 'wide' | 'umatan' | 'sanrenpuku' | 'sanrentan';

interface OddsTableProps {
  odds: OddsDisplay;
  type: OddsType;
}

export default function OddsTable({ odds, type }: OddsTableProps) {
  switch (type) {
    case 'tansho':
      return <TanshoTable data={odds.tansho} />;
    case 'fukusho':
      return <FukushoTable data={odds.fukusho} />;
    case 'wakuren':
      return <CombinationTable data={odds.wakuren} title="枠連" />;
    case 'umaren':
      return <CombinationTable data={odds.umaren} title="馬連" />;
    case 'wide':
      return <WideTable data={odds.wide} />;
    case 'umatan':
      return <CombinationTable data={odds.umatan} title="馬単" />;
    case 'sanrenpuku':
      return <CombinationTable data={odds.sanrenpuku} title="3連複" />;
    case 'sanrentan':
      return <CombinationTable data={odds.sanrentan} title="3連単" />;
    default:
      return null;
  }
}

function TanshoTable({ data }: { data: OddsDisplay['tansho'] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="単勝オッズデータがありません" />;
  }

  const sorted = [...data].sort((a, b) => a.odds - b.odds);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>人気</th>
            <th className="py-2 px-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>馬番</th>
            <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>馬名</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>オッズ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, index) => (
            <motion.tr
              key={item.horseNum}
              className="border-b hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <td className="py-2 px-3">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                    index === 0 ? 'bg-amber-500' :
                    index === 1 ? 'bg-slate-500' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-zinc-500'
                  }`}
                >
                  {index + 1}
                </span>
              </td>
              <td className="py-2 px-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.horseNum}
              </td>
              <td className="py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.horseName}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: '#22c55e' }}>
                {item.odds.toFixed(1)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FukushoTable({ data }: { data: OddsDisplay['fukusho'] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="複勝オッズデータがありません" />;
  }

  const sorted = [...data].sort((a, b) => a.min - b.min);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="py-2 px-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>馬番</th>
            <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>馬名</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>最低</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>最高</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, index) => (
            <motion.tr
              key={item.horseNum}
              className="border-b hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <td className="py-2 px-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.horseNum}
              </td>
              <td className="py-2 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                {item.horseName}
              </td>
              <td className="py-2 px-3 text-right font-mono" style={{ color: '#3b82f6' }}>
                {item.min.toFixed(1)}
              </td>
              <td className="py-2 px-3 text-right font-mono" style={{ color: '#8b5cf6' }}>
                {item.max.toFixed(1)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CombinationTable({ data, title }: { data: { combination: string; odds: number }[]; title: string }) {
  if (!data || data.length === 0) {
    return <EmptyState message={`${title}オッズデータがありません`} />;
  }

  const sorted = [...data].sort((a, b) => a.odds - b.odds).slice(0, 50);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>人気</th>
            <th className="py-2 px-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>組み合わせ</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>オッズ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, index) => (
            <motion.tr
              key={item.combination}
              className="border-b hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
            >
              <td className="py-2 px-3">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {index + 1}
                </span>
              </td>
              <td className="py-2 px-3 text-center font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.combination}
              </td>
              <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: '#22c55e' }}>
                {item.odds.toFixed(1)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>
          上位50件を表示
        </p>
      )}
    </div>
  );
}

function WideTable({ data }: { data: OddsDisplay['wide'] }) {
  if (!data || data.length === 0) {
    return <EmptyState message="ワイドオッズデータがありません" />;
  }

  const sorted = [...data].sort((a, b) => a.min - b.min).slice(0, 50);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th className="py-2 px-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>人気</th>
            <th className="py-2 px-3 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>組み合わせ</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>最低</th>
            <th className="py-2 px-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>最高</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, index) => (
            <motion.tr
              key={item.combination}
              className="border-b hover:bg-[var(--bg-secondary)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
            >
              <td className="py-2 px-3">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {index + 1}
                </span>
              </td>
              <td className="py-2 px-3 text-center font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.combination}
              </td>
              <td className="py-2 px-3 text-right font-mono" style={{ color: '#3b82f6' }}>
                {item.min.toFixed(1)}
              </td>
              <td className="py-2 px-3 text-right font-mono" style={{ color: '#8b5cf6' }}>
                {item.max.toFixed(1)}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>
          上位50件を表示
        </p>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
      {message}
    </div>
  );
}
