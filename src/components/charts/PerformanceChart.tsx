import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PastRace } from '../../types';

interface PerformanceChartProps {
  pastRaces: PastRace[];
  color: string;
}

export default function PerformanceChart({ pastRaces, color }: PerformanceChartProps) {
  // 有効なレースのみ（除外、取消等を除く）
  const validRaces = pastRaces.filter(race => {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    return !isNaN(pos) && pos > 0;
  });

  const data = [...validRaces].reverse().map((race) => ({
    name: race.raceName.slice(0, 6),
    position: typeof race.position === 'string' ? parseInt(race.position, 10) : race.position,
    date: race.date,
    fullName: `${race.place} ${race.raceName} ${race.surface}${race.distance}m`,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          reversed
          domain={[1, 18]}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--border)' }}
          label={{
            value: '着順',
            angle: -90,
            position: 'insideLeft',
            fill: 'var(--text-secondary)',
            fontSize: 12,
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value) => [`${value ?? 0}着`, '着順']}
          labelFormatter={(_, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.fullName;
            }
            return '';
          }}
        />
        <ReferenceLine
          y={3}
          stroke="#10b981"
          strokeDasharray="5 5"
          label={{ value: '複勝圏', fill: '#10b981', fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="position"
          stroke={color}
          strokeWidth={3}
          dot={{
            fill: color,
            strokeWidth: 2,
            r: 6,
          }}
          activeDot={{
            r: 8,
            stroke: color,
            strokeWidth: 2,
            fill: '#fff',
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
