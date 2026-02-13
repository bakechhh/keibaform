import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Horse } from '../../types';
import { getBracketColor } from '../../lib/bracket-utils';

interface ComparisonBarChartProps {
  horses: Horse[];
  statKey?: string;
  label?: string;
}

// 選択可能な指数一覧
const METRIC_OPTIONS = [
  { key: 'ai_win', label: 'AI単勝', getValue: (h: Horse) => h.predictions.win_rate * 100, color: '#ef4444' },
  { key: 'ai_place', label: 'AI連対', getValue: (h: Horse) => h.predictions.place_rate * 100, color: '#3b82f6' },
  { key: 'ai_show', label: 'AI複勝', getValue: (h: Horse) => h.predictions.show_rate * 100, color: '#22c55e' },
  { key: 'final_score', label: '最終Sc', getValue: (h: Horse) => h.indices.final_score, color: '#8b5cf6' },
  { key: 'mining', label: 'Mining', getValue: (h: Horse) => h.indices.mining_index, color: '#06b6d4' },
  { key: 'race_eval', label: 'R評価', getValue: (h: Horse) => h.indices.corrected_time_deviation, color: '#f97316' },
  { key: 'zi', label: '前走ZI', getValue: (h: Horse) => h.indices.zi_deviation, color: '#14b8a6' },
  { key: 'base_score', label: '基礎Sc', getValue: (h: Horse) => h.indices.base_score, color: '#a855f7' },
  { key: 'power', label: '総合力', getValue: (h: Horse) => h.powerScore, color: '#f59e0b' },
  { key: 'overall', label: '総合評価', getValue: (h: Horse) => h.overallRating, color: '#ec4899' },
  { key: 'odds', label: '単勝オッズ', getValue: (h: Horse) => h.tanshoOdds, color: '#84cc16', invert: true },
];

export default function ComparisonBarChart({ horses }: ComparisonBarChartProps) {
  const [selectedMetric, setSelectedMetric] = useState('ai_win');

  const metric = METRIC_OPTIONS.find(m => m.key === selectedMetric) || METRIC_OPTIONS[0];
  const totalHorses = horses.length;

  // データ作成（全馬）
  const data = horses
    .map((horse) => {
      const value = metric.getValue(horse);
      return {
        name: `${horse.number}`,
        fullName: horse.name,
        value: value,
        color: horse.color,
        number: horse.number,
        bracketColor: getBracketColor(horse.number, totalHorses),
      };
    })
    .sort((a, b) => metric.invert ? a.value - b.value : b.value - a.value);

  // 値の範囲を計算
  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const domain = metric.invert
    ? [Math.floor(minVal * 0.9), Math.ceil(maxVal * 1.1)]
    : [0, Math.ceil(maxVal * 1.1)];

  // バーの高さを馬数に応じて調整
  const barHeight = Math.max(18, Math.min(28, 300 / horses.length));
  const chartHeight = Math.max(250, horses.length * (barHeight + 4) + 40);

  return (
    <div>
      {/* ヘッダーとプルダウン */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
          指数ランキング（全{horses.length}頭）
        </h4>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {METRIC_OPTIONS.map(opt => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* チャート */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" margin={{ left: 5, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={domain}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(v) => metric.key === 'odds' ? `${v.toFixed(1)}` : `${v.toFixed(0)}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={30}
            interval={0}
            tick={({ x, y, index }) => {
              // indexを使って直接ソート済みデータにアクセス
              const item = data[index];
              if (!item) return null;
              const bracket = item.bracketColor;
              const isWhiteBracket = bracket.bg === '#FFFFFF';
              return (
                <g transform={`translate(${x},${y})`}>
                  <rect
                    x={-28}
                    y={-10}
                    width={24}
                    height={20}
                    rx={4}
                    fill={bracket.bg}
                    stroke={isWhiteBracket ? '#374151' : 'none'}
                    strokeWidth={isWhiteBracket ? 1.5 : 0}
                  />
                  <text
                    x={-16}
                    y={4}
                    textAnchor="middle"
                    fill={bracket.text}
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {item.number}
                  </text>
                </g>
              );
            }}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0;
              const formatted = metric.key === 'odds'
                ? `${numValue.toFixed(1)}倍`
                : numValue.toFixed(1);
              return [formatted, metric.label];
            }}
            labelFormatter={(_, payload) => {
              if (payload && payload[0]) {
                const p = payload[0].payload;
                return `${p.number}番 ${p.fullName}`;
              }
              return '';
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={barHeight}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.bracketColor.bg}
                stroke={entry.bracketColor.bg === '#FFFFFF' ? '#999' : undefined}
              />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(value) => {
                const numValue = typeof value === 'number' ? value : 0;
                return numValue.toFixed(1);
              }}
              style={{
                fill: 'var(--text-primary)',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ランキングテーブル */}
      <div className="mt-4 max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="py-1 px-1 text-left w-8" style={{ color: 'var(--text-secondary)' }}>順</th>
              <th className="py-1 px-1 text-left" style={{ color: 'var(--text-secondary)' }}>馬</th>
              <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>{metric.label}</th>
              <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>人気</th>
              <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>オッズ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const horse = horses.find(h => h.number === item.number)!;
              return (
                <tr key={item.number} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-1.5 px-1 font-bold" style={{ color: index < 3 ? '#f59e0b' : 'var(--text-secondary)' }}>
                    {index + 1}
                  </td>
                  <td className="py-1.5 px-1">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: item.bracketColor.bg,
                          color: item.bracketColor.text,
                          border: item.bracketColor.bg === '#FFFFFF' ? '1px solid #999' : 'none',
                        }}
                      >
                        {item.number}
                      </span>
                      <span className="truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-1 text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {metric.key === 'odds' ? `${item.value.toFixed(1)}` : item.value.toFixed(1)}
                  </td>
                  <td className="py-1.5 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {horse.popularity}
                  </td>
                  <td className="py-1.5 px-1 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {horse.tanshoOdds.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
