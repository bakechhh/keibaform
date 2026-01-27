import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Horse, HorseStats } from '../../types';

interface ComparisonBarChartProps {
  horses: Horse[];
  statKey: keyof HorseStats;
  label: string;
}

export default function ComparisonBarChart({ horses, statKey, label }: ComparisonBarChartProps) {
  const data = horses
    .map((horse) => ({
      name: horse.name.slice(0, 5),
      fullName: horse.name,
      value: horse.stats[statKey],
      color: horse.color,
      number: horse.number,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // 上位8頭のみ表示

  return (
    <div>
      <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
        {label}ランキング（TOP8）
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={55}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => [value ?? 0, label]}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                const p = payload[0].payload;
                return `${p.number}番 ${p.fullName}`;
              }
              return '';
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
