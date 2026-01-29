import { motion } from 'framer-motion';
import { PastRace } from '../types';

interface RunningStyleAnalysisProps {
  pastRaces: PastRace[];
  color: string;
}

// PCI分類
function classifyPCI(avgPCI: number): { label: string; color: string; description: string } {
  if (avgPCI <= 47) {
    return {
      label: '前加速',
      color: '#ef4444',
      description: '序盤〜中盤で加速するタイプ。逃げ・先行向き',
    };
  } else if (avgPCI <= 52) {
    return {
      label: '持久',
      color: '#3b82f6',
      description: '一定ペースで走るタイプ。中団から差す脚質',
    };
  } else {
    return {
      label: '後半加速',
      color: '#22c55e',
      description: '後半に脚を使うタイプ。差し・追込向き',
    };
  }
}

export default function RunningStyleAnalysis({ pastRaces, color }: RunningStyleAnalysisProps) {
  // 有効なレースのみ（position3fとpciがあるもの）
  const validRaces = pastRaces.filter(race => {
    const pos = typeof race.position === 'string' ? parseInt(race.position, 10) : race.position;
    return !isNaN(pos) && pos > 0 && race.pci > 0;
  });

  if (validRaces.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
        分析に必要なデータがありません
      </div>
    );
  }

  // 平均3F差を計算
  const avg3fPosition = validRaces.reduce((sum, r) => sum + (r.position3f || 0), 0) / validRaces.length;

  // 平均PCIを計算
  const avgPCI = validRaces.reduce((sum, r) => sum + r.pci, 0) / validRaces.length;

  // PCI分類
  const pciClass = classifyPCI(avgPCI);

  // 3F位置のバー表示用（-1.0〜+2.0の範囲を想定）
  const min3f = -1.0;
  const max3f = 2.0;
  const range = max3f - min3f;

  // 0以下の位置は0にクランプ（先頭ラインを超えないように）
  const clampedPosition = Math.max(0, avg3fPosition);
  const positionPercent = Math.max(0, Math.min(100, ((clampedPosition - min3f) / range) * 100));

  // 右から左への表示用（100から引く）
  // 0（先頭）の位置を計算
  const zeroLinePercent = 100 - ((0 - min3f) / range) * 100;
  // 馬の位置は先頭ラインを超えないようにする
  const isClamped = avg3fPosition <= 0; // 先頭と同じか前にいる馬
  const positionPercentReversed = Math.min(100 - positionPercent, zeroLinePercent);

  return (
    <div className="space-y-4">
      {/* 3F位置図（右回りコース対応） */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            残り3F地点での位置
          </span>
          <span className="text-sm font-mono" style={{ color }}>
            平均 {avg3fPosition >= 0 ? '' : ''}{avg3fPosition.toFixed(2)}秒差
          </span>
        </div>

        {/* 位置バー */}
        <div className="relative h-8 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* ゴール表示（右端） */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold z-10">
            G
          </div>

          {/* グリッド線（右から左へ） */}
          <div className="absolute inset-0 flex">
            {[0, 0.5, 1.0, 1.5, 2.0].map((pos, i) => {
              const percent = 100 - ((pos - min3f) / range) * 100;
              return (
                <div
                  key={i}
                  className="absolute h-full border-l"
                  style={{ left: `${percent}%`, borderColor: 'var(--border)' }}
                />
              );
            })}
          </div>

          {/* 先頭ライン（0地点） */}
          <div
            className="absolute h-full w-0.5 bg-amber-500"
            style={{ left: `${100 - ((0 - min3f) / range) * 100}%` }}
          />

          {/* 馬の位置マーカー */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
            style={{
              // クランプされた馬は先頭ラインの左側に配置（マーカーがラインを超えないように）
              left: isClamped ? `calc(${positionPercentReversed}% - 24px)` : `${positionPercentReversed}%`,
              backgroundColor: color,
              marginLeft: '-12px',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            馬
          </motion.div>

          {/* ラベル（右から左：右がゴール側） */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            <span>+2.0</span>
            <span>+1.0</span>
            <span className="text-amber-500 font-bold">先頭</span>
            <span>-1.0</span>
          </div>
        </div>

        <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          右がゴール(G)。0が先頭、+は後方（左側）
        </div>
      </div>

      {/* PCI分類 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            ペース適性（PCI分析）
          </span>
          <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            平均PCI: {avgPCI.toFixed(1)}
          </span>
        </div>

        {/* PCI分類バー */}
        <div className="relative h-10 rounded-lg overflow-hidden flex" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* 前加速ゾーン */}
          <div
            className="h-full flex items-center justify-center text-xs font-bold"
            style={{
              width: '35%',
              backgroundColor: avgPCI <= 47 ? '#ef444430' : 'transparent',
              color: '#ef4444',
            }}
          >
            前加速
          </div>
          {/* 持久ゾーン */}
          <div
            className="h-full flex items-center justify-center text-xs font-bold border-l border-r"
            style={{
              width: '35%',
              backgroundColor: avgPCI > 47 && avgPCI <= 52 ? '#3b82f630' : 'transparent',
              color: '#3b82f6',
              borderColor: 'var(--border)',
            }}
          >
            持久
          </div>
          {/* 後半加速ゾーン */}
          <div
            className="h-full flex items-center justify-center text-xs font-bold"
            style={{
              width: '30%',
              backgroundColor: avgPCI > 52 ? '#22c55e30' : 'transparent',
              color: '#22c55e',
            }}
          >
            後半加速
          </div>

          {/* 現在位置マーカー */}
          <motion.div
            className="absolute top-0 h-full w-1"
            style={{
              left: `${Math.min(100, Math.max(0, ((avgPCI - 40) / 20) * 100))}%`,
              backgroundColor: pciClass.color,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between mt-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <span>45</span>
          <span>47</span>
          <span>52</span>
          <span>60</span>
        </div>
      </div>

      {/* 分類結果 */}
      <motion.div
        className="p-3 rounded-xl"
        style={{ backgroundColor: `${pciClass.color}20` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded text-sm font-bold text-white"
            style={{ backgroundColor: pciClass.color }}
          >
            {pciClass.label}
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            タイプ
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {pciClass.description}
        </p>
      </motion.div>

      {/* 過去走詳細 */}
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">過去走データ（{validRaces.length}走）</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {validRaces.slice(0, 3).map((race, i) => (
            <div key={i} className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="font-mono">{race.date}</div>
              <div>PCI: {race.pci.toFixed(1)}</div>
              <div>3F差: {race.position3f?.toFixed(1) || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
