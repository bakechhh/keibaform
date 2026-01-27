import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { HorseStats } from '../../types';

interface StatsRadarChartProps {
  stats: HorseStats;
  color: string;
}

const statLabels: Record<keyof HorseStats, string> = {
  speed: 'AI勝率',
  stamina: 'AI複勝',
  power: '総合指数',
  guts: '掘出指数',
  intelligence: '基礎点',
  technique: '時計評価',
};

export default function StatsRadarChart({ stats, color }: StatsRadarChartProps) {
  const data = Object.entries(stats).map(([key, value]) => ({
    stat: statLabels[key as keyof HorseStats],
    value: Math.min(100, Math.max(0, value)), // 0-100に制限
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
        />
        <Radar
          name="能力値"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
