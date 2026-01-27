import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface WinRateChartProps {
  winRate: number;
  placeRate: number;
}

export default function WinRateChart({ winRate, placeRate }: WinRateChartProps) {
  const winData = [
    { name: '勝利', value: winRate },
    { name: '敗北', value: 100 - winRate },
  ];

  const placeData = [
    { name: '複勝', value: placeRate },
    { name: '着外', value: 100 - placeRate },
  ];

  const COLORS_WIN = ['#10b981', '#1e293b'];
  const COLORS_PLACE = ['#3b82f6', '#1e293b'];

  return (
    <div className="flex justify-around">
      <div className="text-center">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={winData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {winData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_WIN[index % COLORS_WIN.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value ?? 0}%`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-1">
          <div className="text-2xl font-bold text-emerald-500">{winRate}%</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>勝率</div>
        </div>
      </div>

      <div className="text-center">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={placeData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {placeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS_PLACE[index % COLORS_PLACE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value) => [`${value ?? 0}%`]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-1">
          <div className="text-2xl font-bold text-blue-500">{placeRate}%</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>複勝率</div>
        </div>
      </div>
    </div>
  );
}
