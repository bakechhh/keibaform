import { motion } from 'framer-motion';
import { Horse } from '../types';
import { getBracketColor } from '../lib/bracket-utils';
import { useHorseMarksContext } from '../contexts/HorseMarksContext';
import { DropdownMarkSelector } from './HorseMarkSelector';

interface RaceAnalysisViewProps {
  horses: Horse[];
}

// PCI分類を計算
function classifyPCI(avgPCI: number): { label: string; color: string; shortLabel: string } {
  if (avgPCI <= 47) {
    return { label: '前加速', color: '#ef4444', shortLabel: '前' };
  } else if (avgPCI <= 52) {
    return { label: '持久', color: '#3b82f6', shortLabel: '持' };
  } else {
    return { label: '後半加速', color: '#22c55e', shortLabel: '後' };
  }
}

// 馬ごとの分析データを計算
function analyzeHorse(horse: Horse) {
  const validRaces = horse.pastRaces.filter(race => {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    return !isNaN(pos) && pos > 0 && race.pci > 0;
  });

  // Ave3Fのある有効レース（別途フィルター）
  const validAve3fRaces = horse.pastRaces.filter(race => {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    return !isNaN(pos) && pos > 0 && race.ave3f > 0;
  });

  // Last3Fのある有効レース
  const validLast3fRaces = horse.pastRaces.filter(race => {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    return !isNaN(pos) && pos > 0 && race.last3f > 0;
  });

  if (validRaces.length === 0) {
    return {
      avg3fPosition: null,
      avgPCI: null,
      pciClass: null,
      raceCount: 0,
      avgAve3f: null,
      avgLast3f: null,
    };
  }

  const avg3fPosition = validRaces.reduce((sum, r) => sum + (r.position3f || 0), 0) / validRaces.length;
  const avgPCI = validRaces.reduce((sum, r) => sum + r.pci, 0) / validRaces.length;

  // 平均Ave3F（前半3Fペース）
  const avgAve3f = validAve3fRaces.length > 0
    ? validAve3fRaces.reduce((sum, r) => sum + r.ave3f, 0) / validAve3fRaces.length
    : null;

  // 平均Last3F（上がり3F）
  const avgLast3f = validLast3fRaces.length > 0
    ? validLast3fRaces.reduce((sum, r) => sum + r.last3f, 0) / validLast3fRaces.length
    : null;

  return {
    avg3fPosition,
    avgPCI,
    pciClass: classifyPCI(avgPCI),
    raceCount: validRaces.length,
    avgAve3f,
    avgLast3f,
  };
}

// ペース余裕度分析コンポーネント
interface PaceMarginAnalysisProps {
  horseAnalysis: Array<{
    horse: Horse;
    analysis: {
      avg3fPosition: number | null;
      avgPCI: number | null;
      pciClass: { label: string; color: string; shortLabel: string } | null;
      raceCount: number;
      avgAve3f: number | null;
      avgLast3f: number | null;
    };
    normalizedPosition: number;
  }>;
  totalHorses: number;
}

function PaceMarginAnalysis({ horseAnalysis, totalHorses }: PaceMarginAnalysisProps) {
  // Ave3Fデータがある馬のみ
  const horsesWithAve3f = horseAnalysis.filter(h => h.analysis.avgAve3f !== null);

  if (horsesWithAve3f.length < 2) {
    return (
      <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          ペース余裕度分析
        </h4>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Ave3Fデータが不足しています（2頭以上必要）
        </p>
      </div>
    );
  }

  // レース予想ペース = 全馬のAve3F平均
  const projectedPace = horsesWithAve3f.reduce((sum, h) => sum + (h.analysis.avgAve3f || 0), 0) / horsesWithAve3f.length;

  // 各馬の余裕度を計算
  // 余裕度 = レース予想ペース - 馬のAve3F
  // プラス = 馬は普段より遅いペースで走れる = 余裕あり
  // マイナス = 馬は普段より速いペースで走らされる = キツい
  const paceMarginData = horsesWithAve3f.map(h => {
    const margin = projectedPace - (h.analysis.avgAve3f || 0);
    // 余裕度による上がり3Fへの影響予測（余裕があれば上がりが良くなる可能性）
    // 余裕0.5秒 → 上がり0.3~0.5秒改善の可能性など
    const potentialImprovement = margin > 0 ? margin * 0.7 : margin * 0.5;

    return {
      ...h,
      margin,
      potentialImprovement,
      projectedLast3f: h.analysis.avgLast3f !== null
        ? h.analysis.avgLast3f - potentialImprovement
        : null,
    };
  }).sort((a, b) => b.margin - a.margin); // 余裕度が高い順

  // マージンの最大最小（グラフ描画用）
  const maxMargin = Math.max(...paceMarginData.map(h => Math.abs(h.margin)), 0.5);

  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          ペース余裕度分析
        </h4>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          予想ペース: <span className="font-mono font-bold" style={{ color: '#3b82f6' }}>{projectedPace.toFixed(2)}</span>秒
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        全馬のAve3F平均からレースペースを予測し、各馬の「脚の余裕度」を算出。
        プラスの馬は普段より楽なペースで走れるため、上がりに余力を残せる可能性。
      </p>

      {/* 余裕度バーチャート */}
      <div className="space-y-2">
        {paceMarginData.map((item, index) => {
          const bracketColor = getBracketColor(item.horse.number, totalHorses);
          const barWidth = (Math.abs(item.margin) / maxMargin) * 50; // 最大50%
          const isPositive = item.margin >= 0;

          return (
            <motion.div
              key={item.horse.id}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              {/* 馬番・馬名 */}
              <div className="flex items-center gap-1 w-24 flex-shrink-0">
                <span
                  className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center border"
                  style={{
                    backgroundColor: bracketColor.bg,
                    color: bracketColor.text,
                    borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                  }}
                >
                  {item.horse.number}
                </span>
                <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.horse.name.slice(0, 4)}
                </span>
              </div>

              {/* バーチャート */}
              <div className="flex-1 flex items-center h-6">
                {/* マイナス側（左） */}
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <motion.div
                      className="h-4 rounded-l"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: '#ef4444',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                    />
                  )}
                </div>
                {/* 中央線 */}
                <div className="w-px h-6 bg-gray-400" />
                {/* プラス側（右） */}
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <motion.div
                      className="h-4 rounded-r"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: '#22c55e',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                    />
                  )}
                </div>
              </div>

              {/* 数値 */}
              <div className="w-20 flex-shrink-0 text-right">
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
                >
                  {isPositive ? '+' : ''}{item.margin.toFixed(2)}秒
                </span>
              </div>

              {/* 予測上がり */}
              {item.projectedLast3f !== null && (
                <div className="w-20 flex-shrink-0 text-right">
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    予測上がり
                  </span>
                  <span className="text-xs font-mono ml-1" style={{ color: '#f59e0b' }}>
                    {item.projectedLast3f.toFixed(1)}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 注目馬ピックアップ */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-2 gap-4">
          {/* 余裕度上位 */}
          <div>
            <h5 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#22c55e' }}>
              <span className="w-3 h-3 rounded-full bg-green-500" />
              余裕あり（上がり期待）
            </h5>
            <div className="space-y-1">
              {paceMarginData.filter(h => h.margin >= 0.3).slice(0, 3).map(item => {
                const bracketColor = getBracketColor(item.horse.number, totalHorses);
                return (
                  <div key={item.horse.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                      style={{
                        backgroundColor: bracketColor.bg,
                        color: bracketColor.text,
                        borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                      }}
                    >
                      {item.horse.number}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{item.horse.name}</span>
                    <span className="ml-auto font-mono text-green-500">+{item.margin.toFixed(2)}</span>
                  </div>
                );
              })}
              {paceMarginData.filter(h => h.margin >= 0.3).length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>該当なし</span>
              )}
            </div>
          </div>

          {/* 余裕度下位 */}
          <div>
            <h5 className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#ef4444' }}>
              <span className="w-3 h-3 rounded-full bg-red-500" />
              キツい（消耗注意）
            </h5>
            <div className="space-y-1">
              {paceMarginData.filter(h => h.margin <= -0.3).slice(-3).reverse().map(item => {
                const bracketColor = getBracketColor(item.horse.number, totalHorses);
                return (
                  <div key={item.horse.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                      style={{
                        backgroundColor: bracketColor.bg,
                        color: bracketColor.text,
                        borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                      }}
                    >
                      {item.horse.number}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{item.horse.name}</span>
                    <span className="ml-auto font-mono text-red-500">{item.margin.toFixed(2)}</span>
                  </div>
                );
              })}
              {paceMarginData.filter(h => h.margin <= -0.3).length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>該当なし</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細テーブル */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <h5 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
          詳細データ
        </h5>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="py-1 px-1 text-left" style={{ color: 'var(--text-secondary)' }}>馬</th>
                <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>Ave3F</th>
                <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>余裕度</th>
                <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>平均上がり</th>
                <th className="py-1 px-1 text-right" style={{ color: 'var(--text-secondary)' }}>予測上がり</th>
              </tr>
            </thead>
            <tbody>
              {paceMarginData.map(item => {
                const bracketColor = getBracketColor(item.horse.number, totalHorses);
                const isPositive = item.margin >= 0;
                return (
                  <tr key={item.horse.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-1 px-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                          style={{
                            backgroundColor: bracketColor.bg,
                            color: bracketColor.text,
                            borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                          }}
                        >
                          {item.horse.number}
                        </span>
                        <span style={{ color: 'var(--text-primary)' }}>{item.horse.name}</span>
                      </div>
                    </td>
                    <td className="py-1 px-1 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                      {item.analysis.avgAve3f?.toFixed(2)}
                    </td>
                    <td className="py-1 px-1 text-right font-mono font-bold" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
                      {isPositive ? '+' : ''}{item.margin.toFixed(2)}
                    </td>
                    <td className="py-1 px-1 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {item.analysis.avgLast3f?.toFixed(1) || '-'}
                    </td>
                    <td className="py-1 px-1 text-right font-mono" style={{ color: '#f59e0b' }}>
                      {item.projectedLast3f?.toFixed(1) || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RaceAnalysisView({ horses }: RaceAnalysisViewProps) {
  const totalHorses = horses.length;
  const { getMark, setMark, getMemo } = useHorseMarksContext();

  // 各馬の分析データを計算
  const horseAnalysis = horses.map(horse => ({
    horse,
    analysis: analyzeHorse(horse),
  })).filter(h => h.analysis.avg3fPosition !== null);

  if (horseAnalysis.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
        分析に必要な過去走データがありません
      </div>
    );
  }

  // 3F位置の正規化: 最も前にいる馬を0とする
  const rawPositions = horseAnalysis.map(h => h.analysis.avg3fPosition || 0);
  const minRawPos = Math.min(...rawPositions);

  // 正規化された位置を持つ分析データ
  const normalizedHorseAnalysis = horseAnalysis.map(h => ({
    ...h,
    normalizedPosition: (h.analysis.avg3fPosition || 0) - minRawPos,
  }));

  // 3F位置でソート（前にいる順）
  const sortedBy3f = [...normalizedHorseAnalysis].sort((a, b) =>
    a.normalizedPosition - b.normalizedPosition
  );

  // 正規化後の位置の範囲を計算
  // 先頭ライン（0）の右側にバッファを設ける（-0.3〜maxPos）
  const normalizedPositions = normalizedHorseAnalysis.map(h => h.normalizedPosition);
  const maxNormalizedPos = Math.max(...normalizedPositions, 1.5);
  const minPos = -0.3; // 先頭ラインの右側にバッファ（ゴール方向）
  const maxPos = Math.max(maxNormalizedPos, 1.5); // 最低でも1.5秒差まで表示
  const range = maxPos - minPos;

  return (
    <div className="space-y-6">
      {/* 3F位置図（全馬） - 右回りコース対応（右がゴール） */}
      <div>
        <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          残り3F地点での位置（全馬・レース内相対位置）
        </h4>
        <div className="relative h-32 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* ゴール表示（右端） */}
          <div className="absolute right-2 top-2 px-2 py-1 rounded bg-amber-500 text-white text-xs font-bold">
            G
          </div>

          {/* グリッド線（右から左へ：0が右、大きい数字が左） */}
          {[0, 0.5, 1.0, 1.5, 2.0].map((pos, i) => {
            if (pos < minPos || pos > maxPos) return null;
            // 右から左へ表示するため、100から引く
            const percent = 100 - ((pos - minPos) / range) * 100;
            return (
              <div key={i} className="absolute h-full flex flex-col items-center" style={{ left: `${percent}%` }}>
                <div className="h-full border-l" style={{ borderColor: pos === 0 ? '#f59e0b' : 'var(--border)', borderWidth: pos === 0 ? '2px' : '1px' }} />
                <span className="absolute bottom-1 text-[10px] transform -translate-x-1/2" style={{ color: pos === 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                  {pos === 0 ? '先頭' : `+${pos.toFixed(1)}`}
                </span>
              </div>
            );
          })}

          {/* 馬のマーカー（右から左へ） */}
          {sortedBy3f.map((item, index) => {
            // 正規化された位置を使用（最前の馬が0）
            const pos = item.normalizedPosition;
            // 右から左へ表示するため、100から引く
            // 先頭ライン（0地点）のパーセント位置
            const zeroPercent = 100 - ((0 - minPos) / range) * 100;
            // 馬の位置のパーセント
            const rawPercent = 100 - ((pos - minPos) / range) * 100;
            // 馬が先頭ラインに近い場合（先頭馬など）はマーカーがラインを超えないようオフセット
            const isNearLeaderLine = rawPercent >= zeroPercent - 3;
            const yOffset = 10 + (index % 3) * 35; // 縦に分散

            // 枠番色を取得
            const bracketColor = getBracketColor(item.horse.number, totalHorses);

            return (
              <motion.div
                key={item.horse.id}
                className="absolute"
                style={{
                  // 先頭ライン付近の馬はマーカー幅分左にオフセット
                  left: isNearLeaderLine
                    ? `calc(${zeroPercent}% - 14px)`
                    : `${rawPercent}%`,
                  top: `${yOffset}px`,
                  transform: 'translateX(-50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2"
                  style={{
                    backgroundColor: bracketColor.bg,
                    color: bracketColor.text,
                    borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                  }}
                  title={item.horse.name}
                >
                  {item.horse.number}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          右がゴール(G)。このレースで最も前にいる馬を先頭(0)として相対位置を表示
        </div>
      </div>

      {/* ペース余裕度分析 */}
      <PaceMarginAnalysis horseAnalysis={normalizedHorseAnalysis} totalHorses={totalHorses} />

      {/* 加速タイプ分類表 */}
      <div>
        <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          ペース適性分類
        </h4>

        {/* カテゴリ別グループ */}
        <div className="grid grid-cols-3 gap-3">
          {/* 前加速 */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#ef444420' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: '#ef4444' }}>
                前加速
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                PCI≤47
              </span>
            </div>
            <div className="space-y-1">
              {normalizedHorseAnalysis
                .filter(h => h.analysis.pciClass?.label === '前加速')
                .map(item => {
                  const bracketColor = getBracketColor(item.horse.number, totalHorses);
                  return (
                    <div key={item.horse.id} className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                        style={{
                          backgroundColor: bracketColor.bg,
                          color: bracketColor.text,
                          borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                        }}
                      >
                        {item.horse.number}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.horse.name}
                      </span>
                    </div>
                  );
                })}
              {normalizedHorseAnalysis.filter(h => h.analysis.pciClass?.label === '前加速').length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>なし</span>
              )}
            </div>
          </div>

          {/* 持久 */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#3b82f620' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: '#3b82f6' }}>
                持久
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                47-52
              </span>
            </div>
            <div className="space-y-1">
              {normalizedHorseAnalysis
                .filter(h => h.analysis.pciClass?.label === '持久')
                .map(item => {
                  const bracketColor = getBracketColor(item.horse.number, totalHorses);
                  return (
                    <div key={item.horse.id} className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                        style={{
                          backgroundColor: bracketColor.bg,
                          color: bracketColor.text,
                          borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                        }}
                      >
                        {item.horse.number}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.horse.name}
                      </span>
                    </div>
                  );
                })}
              {normalizedHorseAnalysis.filter(h => h.analysis.pciClass?.label === '持久').length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>なし</span>
              )}
            </div>
          </div>

          {/* 後半加速 */}
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#22c55e20' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: '#22c55e' }}>
                後半加速
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                PCI&gt;52
              </span>
            </div>
            <div className="space-y-1">
              {normalizedHorseAnalysis
                .filter(h => h.analysis.pciClass?.label === '後半加速')
                .map(item => {
                  const bracketColor = getBracketColor(item.horse.number, totalHorses);
                  return (
                    <div key={item.horse.id} className="flex items-center gap-1">
                      <span
                        className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border"
                        style={{
                          backgroundColor: bracketColor.bg,
                          color: bracketColor.text,
                          borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                        }}
                      >
                        {item.horse.number}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.horse.name}
                      </span>
                    </div>
                  );
                })}
              {normalizedHorseAnalysis.filter(h => h.analysis.pciClass?.label === '後半加速').length === 0 && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>なし</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細テーブル */}
      <div>
        <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          詳細データ
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="py-2 px-2 text-left" style={{ color: 'var(--text-secondary)' }}>馬</th>
                <th className="py-2 px-1 text-center" style={{ color: 'var(--text-secondary)' }}>印</th>
                <th className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>相対位置</th>
                <th className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>平均PCI</th>
                <th className="py-2 px-2 text-center" style={{ color: 'var(--text-secondary)' }}>タイプ</th>
                <th className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>走数</th>
              </tr>
            </thead>
            <tbody>
              {sortedBy3f.map(item => {
                const bracketColor = getBracketColor(item.horse.number, totalHorses);
                const currentMark = getMark(item.horse.name);
                const memo = getMemo(item.horse.name);
                return (
                  <tr key={item.horse.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center border"
                          style={{
                            backgroundColor: bracketColor.bg,
                            color: bracketColor.text,
                            borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                          }}
                        >
                          {item.horse.number}
                        </span>
                        <div>
                          <span style={{ color: 'var(--text-primary)' }}>{item.horse.name}</span>
                          {memo && (
                            <div className="text-[10px] text-amber-500 truncate max-w-[80px]" title={memo}>
                              {memo}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center">
                      <DropdownMarkSelector
                        currentMark={currentMark}
                        onSelect={(mark) => setMark(item.horse.name, mark)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: item.normalizedPosition === 0 ? '#f59e0b' : item.normalizedPosition <= 0.3 ? '#22c55e' : 'var(--text-primary)' }}>
                      {item.normalizedPosition === 0 ? '先頭' : `+${item.normalizedPosition.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                      {item.analysis.avgPCI?.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: item.analysis.pciClass?.color }}
                      >
                        {item.analysis.pciClass?.label}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {item.analysis.raceCount}走
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
