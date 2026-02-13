import { PastRace } from '../types';

interface DistanceAptitudeMatrixProps {
  pastRaces: PastRace[];
  currentSurface?: string;
  currentDistance?: number;
}

type DistanceBand = '~1200' | '1300-1600' | '1700-2000' | '2100+';

function getDistanceBand(distance: number): DistanceBand {
  if (distance <= 1200) return '~1200';
  if (distance <= 1600) return '1300-1600';
  if (distance <= 2000) return '1700-2000';
  return '2100+';
}

interface CellData {
  count: number;
  avgPosition: number;
  showRate: number; // 3着以内率
}

export default function DistanceAptitudeMatrix({
  pastRaces,
  currentSurface,
  currentDistance,
}: DistanceAptitudeMatrixProps) {
  const surfaces = ['芝', 'ダ'] as const;
  const distanceBands: DistanceBand[] = ['~1200', '1300-1600', '1700-2000', '2100+'];

  // Build matrix data
  const matrix = new Map<string, CellData>();

  for (const race of pastRaces) {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    if (isNaN(pos) || pos <= 0) continue;

    const surface = race.surface.includes('芝') ? '芝' : 'ダ';
    const band = getDistanceBand(race.distance);
    const key = `${surface}-${band}`;

    if (!matrix.has(key)) {
      matrix.set(key, { count: 0, avgPosition: 0, showRate: 0 });
    }

    const cell = matrix.get(key)!;
    cell.avgPosition = (cell.avgPosition * cell.count + pos) / (cell.count + 1);
    cell.showRate = (cell.showRate * cell.count + (pos <= 3 ? 1 : 0)) / (cell.count + 1);
    cell.count++;
  }

  const currentBand = currentDistance ? getDistanceBand(currentDistance) : null;
  const currentSurfaceNorm = currentSurface?.includes('芝') ? '芝' : currentSurface ? 'ダ' : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="py-2 px-2 text-left" style={{ color: 'var(--text-secondary)' }}>馬場</th>
            {distanceBands.map(band => (
              <th key={band} className="py-2 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                {band}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {surfaces.map(surface => (
            <tr key={surface} className="border-t" style={{ borderColor: 'var(--border)' }}>
              <td className="py-2 px-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                {surface === '芝' ? '芝' : 'ダート'}
              </td>
              {distanceBands.map(band => {
                const key = `${surface}-${band}`;
                const cell = matrix.get(key);
                const isHighlight = surface === currentSurfaceNorm && band === currentBand;

                if (!cell) {
                  return (
                    <td
                      key={band}
                      className={`py-2 px-2 text-center ${isHighlight ? 'ring-2 ring-amber-400 rounded' : ''}`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      -
                    </td>
                  );
                }

                const showRatePct = Math.round(cell.showRate * 100);
                const showRateColor = showRatePct >= 50 ? '#22c55e' : showRatePct >= 30 ? '#f59e0b' : '#ef4444';

                return (
                  <td
                    key={band}
                    className={`py-2 px-2 text-center ${isHighlight ? 'ring-2 ring-amber-400 rounded bg-amber-500/10' : ''}`}
                  >
                    <div className="font-mono font-bold" style={{ color: showRateColor }}>
                      {showRatePct}%
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {cell.count}走 avg{cell.avgPosition.toFixed(1)}着
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {currentBand && currentSurfaceNorm && (
        <div className="mt-2 text-[10px] text-amber-400">
          * 黄色枠は今回の条件（{currentSurfaceNorm}{currentDistance}m）
        </div>
      )}
    </div>
  );
}
