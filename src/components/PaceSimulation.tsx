import { motion } from 'framer-motion';
import { Horse } from '../types';
import { getBracketColor } from '../lib/bracket-utils';

interface PaceSimulationProps {
  horses: Horse[];
  raceDistance?: number;
  raceSurface?: string;
}

type RunningStyle = '逃' | '先' | '差' | '追' | '不明';

function getMainRunningStyle(horse: Horse): RunningStyle {
  const validRaces = horse.pastRaces.filter(r => r.runningStyle);
  if (validRaces.length === 0) return '不明';

  const counts = new Map<string, number>();
  for (const race of validRaces) {
    const style = race.runningStyle;
    counts.set(style, (counts.get(style) || 0) + 1);
  }

  let maxStyle = '';
  let maxCount = 0;
  for (const [style, count] of counts) {
    if (count > maxCount) {
      maxStyle = style;
      maxCount = count;
    }
  }

  if (maxStyle.includes('逃')) return '逃';
  if (maxStyle.includes('先')) return '先';
  if (maxStyle.includes('差')) return '差';
  if (maxStyle.includes('追')) return '追';
  return '不明';
}

const styleColors: Record<RunningStyle, string> = {
  '逃': '#ef4444',
  '先': '#f59e0b',
  '差': '#3b82f6',
  '追': '#8b5cf6',
  '不明': '#6b7280',
};

const styleLabels: Record<RunningStyle, string> = {
  '逃': '逃げ',
  '先': '先行',
  '差': '差し',
  '追': '追込',
  '不明': '不明',
};

export default function PaceSimulation({ horses, raceDistance, raceSurface }: PaceSimulationProps) {
  const totalHorses = horses.length;

  // 1. Determine each horse's main running style
  const horseStyles = horses.map(horse => ({
    horse,
    style: getMainRunningStyle(horse),
  }));

  // 2. Count distribution
  const styleCounts: Record<RunningStyle, number> = { '逃': 0, '先': 0, '差': 0, '追': 0, '不明': 0 };
  for (const { style } of horseStyles) {
    styleCounts[style]++;
  }

  const knownCount = totalHorses - styleCounts['不明'];
  const frontRunners = styleCounts['逃'] + styleCounts['先'];
  const frontRatio = knownCount > 0 ? frontRunners / knownCount : 0;

  // 3. Pace prediction
  let pacePrediction: { label: string; color: string; description: string; advantaged: RunningStyle[] };
  if (frontRatio > 0.5) {
    pacePrediction = {
      label: 'ハイペース',
      color: '#ef4444',
      description: '逃げ・先行馬が多く前が潰れる展開。差し・追込馬に有利。',
      advantaged: ['差', '追'],
    };
  } else if (styleCounts['逃'] < 2) {
    pacePrediction = {
      label: 'スローペース',
      color: '#3b82f6',
      description: '逃げ馬が少なくペースが緩む展開。逃げ・先行馬に有利。',
      advantaged: ['逃', '先'],
    };
  } else {
    pacePrediction = {
      label: '平均ペース',
      color: '#22c55e',
      description: 'バランスの取れた展開。実力通りの結果になりやすい。',
      advantaged: [],
    };
  }

  // 4. Average ave3f and last3f
  const horsesWithAve3f = horses.filter(h => h.pastRaces.some(r => r.ave3f > 0));
  const horsesWithLast3f = horses.filter(h => h.pastRaces.some(r => r.last3f > 0));

  const avgAve3f = horsesWithAve3f.length > 0
    ? horsesWithAve3f.reduce((sum, h) => {
        const validRaces = h.pastRaces.filter(r => r.ave3f > 0);
        const avg = validRaces.reduce((s, r) => s + r.ave3f, 0) / validRaces.length;
        return sum + avg;
      }, 0) / horsesWithAve3f.length
    : null;

  const avgLast3f = horsesWithLast3f.length > 0
    ? horsesWithLast3f.reduce((sum, h) => {
        const validRaces = h.pastRaces.filter(r => r.last3f > 0);
        const avg = validRaces.reduce((s, r) => s + r.last3f, 0) / validRaces.length;
        return sum + avg;
      }, 0) / horsesWithLast3f.length
    : null;

  // 5. Pick advantaged horses
  const advantagedHorses = pacePrediction.advantaged.length > 0
    ? horseStyles.filter(h => pacePrediction.advantaged.includes(h.style))
    : [];

  return (
    <div className="space-y-4">
      {/* Race Info */}
      {(raceDistance || raceSurface) && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {raceSurface && <span className="px-2 py-0.5 rounded bg-gray-500/20">{raceSurface}</span>}
          {raceDistance && <span className="px-2 py-0.5 rounded bg-gray-500/20">{raceDistance}m</span>}
        </div>
      )}

      {/* Pace Prediction */}
      <div
        className="p-4 rounded-xl border-2"
        style={{ borderColor: pacePrediction.color + '60', backgroundColor: pacePrediction.color + '10' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            className="px-3 py-1 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: pacePrediction.color }}
          >
            {pacePrediction.label}
          </span>
          {avgAve3f && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              前半avg: {avgAve3f.toFixed(2)}
            </span>
          )}
          {avgLast3f && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              上がりavg: {avgLast3f.toFixed(1)}
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {pacePrediction.description}
        </p>
      </div>

      {/* Running Style Distribution */}
      <div>
        <h5 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          脚質分布
        </h5>
        <div className="grid grid-cols-4 gap-2">
          {(['逃', '先', '差', '追'] as RunningStyle[]).map(style => {
            const count = styleCounts[style];
            const pct = knownCount > 0 ? Math.round((count / knownCount) * 100) : 0;
            const isAdvantaged = pacePrediction.advantaged.includes(style);
            return (
              <div
                key={style}
                className={`p-3 rounded-xl text-center ${isAdvantaged ? 'ring-2' : ''}`}
                style={{
                  backgroundColor: styleColors[style] + '15',
                  ...(isAdvantaged ? { '--tw-ring-color': styleColors[style] } as React.CSSProperties : {}),
                }}
              >
                <div className="text-lg font-bold" style={{ color: styleColors[style] }}>
                  {count}
                </div>
                <div className="text-xs font-bold" style={{ color: styleColors[style] }}>
                  {styleLabels[style]}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {pct}%
                </div>
                {isAdvantaged && (
                  <div className="text-[10px] font-bold mt-1" style={{ color: styleColors[style] }}>
                    有利
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {styleCounts['不明'] > 0 && (
          <div className="mt-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            * 不明: {styleCounts['不明']}頭（過去走データなし）
          </div>
        )}
      </div>

      {/* Advantaged Horses Pickup */}
      {advantagedHorses.length > 0 && (
        <div>
          <h5 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            展開有利な馬
          </h5>
          <div className="flex flex-wrap gap-2">
            {advantagedHorses.map(({ horse, style }) => {
              const bracketColor = getBracketColor(horse.number, totalHorses);
              return (
                <motion.div
                  key={horse.id}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
                  style={{ backgroundColor: styleColors[style] + '15' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span
                    className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center border"
                    style={{
                      backgroundColor: bracketColor.bg,
                      color: bracketColor.text,
                      borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                    }}
                  >
                    {horse.number}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {horse.name}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: styleColors[style] }}
                  >
                    {styleLabels[style]}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
