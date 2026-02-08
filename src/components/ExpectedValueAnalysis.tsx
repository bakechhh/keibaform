import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Horse } from '../types';
import { getBracketColor } from '../lib/bracket-utils';
import { useHorseMarksContext } from '../contexts/HorseMarksContext';
import { DropdownMarkSelector } from './HorseMarkSelector';

interface ExpectedValueAnalysisProps {
  horses: Horse[];
  totalHorses: number;
}

interface EVData {
  horse: Horse;
  marketShare: number;      // 市場シェア率（オッズから）
  aiWinShare: number;       // AI単勝シェア率（正規化済み）
  aiShowShare: number;      // AI複勝シェア率（正規化済み）
  winEdge: number;          // 単勝エッジ（AIシェア - 市場シェア）
  showEdge: number;         // 複勝エッジ
  winZScore: number;        // 単勝Z得点
  efficiency: string;       // 効率ランク
  isValueBet: boolean;
  recommendation: string;
  bracketColor: { bg: string; text: string };
}

// Z得点を計算
function calculateZScore(values: number[], targetValue: number): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (targetValue - mean) / stdDev;
}

export default function ExpectedValueAnalysis({ horses, totalHorses }: ExpectedValueAnalysisProps) {
  const { getMark, setMark, getMemo } = useHorseMarksContext();

  // === シェア率の計算（すべて正規化して100%に） ===

  // 市場シェア率 = 1/オッズを正規化
  const oddsInverseSum = horses.reduce((sum, h) => sum + (1 / h.tanshoOdds), 0);

  // AI単勝シェア率 = win_rateを正規化
  const aiWinSum = horses.reduce((sum, h) => sum + h.predictions.win_rate, 0);

  // AI複勝シェア率 = show_rateを正規化
  const aiShowSum = horses.reduce((sum, h) => sum + h.predictions.show_rate, 0);

  // 各馬のエッジを計算
  const edgeData = horses.map(horse => {
    const marketShare = (1 / horse.tanshoOdds) / oddsInverseSum;
    const aiWinShare = horse.predictions.win_rate / aiWinSum;
    const aiShowShare = horse.predictions.show_rate / aiShowSum;

    return {
      horse,
      marketShare,
      aiWinShare,
      aiShowShare,
      winEdge: aiWinShare - marketShare,
      showEdge: aiShowShare - marketShare,
    };
  });

  // エッジのZ得点を計算
  const winEdges = edgeData.map(d => d.winEdge);

  // 最終EVデータ作成
  const evData: EVData[] = edgeData.map(data => {
    const winZScore = calculateZScore(winEdges, data.winEdge);

    // 妙味判定ロジック:
    // - 単勝エッジ > 0 かつ Z得点 > 0.5 なら妙味あり
    // - 効率ランクも考慮
    const efficiency = data.horse.efficiency.rank;
    const isGoodEfficiency = ['SS', 'S', 'A+', 'A'].includes(efficiency);

    // バリューベット判定
    // Z得点が高い（平均より0.8σ以上）かつ効率ランクが良い
    const isValueBet = winZScore >= 0.8 && isGoodEfficiency;

    // レコメンデーション
    let recommendation = '';
    if (winZScore >= 1.5 && isGoodEfficiency) {
      recommendation = '激熱';
    } else if (winZScore >= 1.0 && isGoodEfficiency) {
      recommendation = '妙味大';
    } else if (winZScore >= 0.5 && data.winEdge > 0) {
      recommendation = '妙味あり';
    } else if (winZScore >= 0 && data.horse.predictions.win_rate_rank <= 3) {
      recommendation = '軸候補';
    } else if (winZScore <= -1.0 && data.marketShare >= 0.08) {
      recommendation = '過剰人気';
    } else if (winZScore <= -0.5 && data.marketShare >= 0.05) {
      recommendation = '割高';
    }

    return {
      horse: data.horse,
      marketShare: data.marketShare,
      aiWinShare: data.aiWinShare,
      aiShowShare: data.aiShowShare,
      winEdge: data.winEdge,
      showEdge: data.showEdge,
      winZScore,
      efficiency,
      isValueBet,
      recommendation,
      bracketColor: getBracketColor(data.horse.number, totalHorses),
    };
  }).sort((a, b) => b.winZScore - a.winZScore);

  // バリューベットの数
  const valueBetCount = evData.filter(d => d.isValueBet).length;

  // 最高Z得点
  const maxZScore = evData[0]?.winZScore || 0;

  // 過剰人気馬
  const overhypedCount = evData.filter(d => d.recommendation === '過剰人気').length;

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>妙味あり</div>
          <div className="text-2xl font-bold text-emerald-500">{valueBetCount}頭</div>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>最高Z値</div>
          <div className="text-2xl font-bold text-amber-500">
            {maxZScore >= 0 ? '+' : ''}{maxZScore.toFixed(2)}
          </div>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>過剰人気</div>
          <div className="text-2xl font-bold text-red-400">{overhypedCount}頭</div>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>出走</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{horses.length}頭</div>
        </div>
      </div>

      {/* 期待値の解説 */}
      <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
        <div className="flex items-center gap-1 mb-1">
          <AlertCircle className="w-3 h-3" />
          <span className="font-medium">シェア率比較分析</span>
        </div>
        <p>市場シェア・AI単勝シェア・AI複勝シェアをすべて正規化（合計100%）し、エッジ（AIシェア−市場シェア）のZ得点で相対評価。Z値が高く効率ランクも良い馬が「妙味あり」です。</p>
      </div>

      {/* 期待値テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              <th className="py-2 px-2 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>馬</th>
              <th className="py-2 px-1 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>印</th>
              <th className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>市場</th>
              <th className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>AI単</th>
              <th className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>AI複</th>
              <th className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>Z値</th>
              <th className="py-2 px-2 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>効率</th>
              <th className="py-2 px-2 text-center font-medium" style={{ color: 'var(--text-secondary)' }}>判定</th>
            </tr>
          </thead>
          <tbody>
            {evData.map((data, index) => {
              const currentMark = getMark(data.horse.name);
              const memo = getMemo(data.horse.name);
              return (
                <motion.tr
                  key={data.horse.id}
                  className={`border-b ${data.isValueBet ? 'bg-emerald-500/10' : data.recommendation === '過剰人気' ? 'bg-red-500/5' : ''}`}
                  style={{ borderColor: 'var(--border)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: data.bracketColor.bg,
                          color: data.bracketColor.text,
                          border: data.bracketColor.bg === '#FFFFFF' ? '1px solid #374151' : 'none',
                        }}
                      >
                        {data.horse.number}
                      </span>
                      <div>
                        <span className="truncate max-w-[60px] block" style={{ color: 'var(--text-primary)' }}>
                          {data.horse.name}
                        </span>
                        {memo && (
                          <div className="text-[10px] text-amber-500 truncate max-w-[60px]" title={memo}>
                            {memo}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center">
                    <DropdownMarkSelector
                      currentMark={currentMark}
                      onSelect={(mark) => setMark(data.horse.name, mark)}
                    />
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {(data.marketShare * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs" style={{ color: '#ef4444' }}>
                    {(data.aiWinShare * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs" style={{ color: '#22c55e' }}>
                    {(data.aiShowShare * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={`font-mono font-bold text-xs ${data.winZScore >= 0.5 ? 'text-emerald-500' : data.winZScore <= -0.5 ? 'text-red-400' : ''}`}
                      style={{ color: data.winZScore >= 0.5 ? undefined : data.winZScore <= -0.5 ? undefined : 'var(--text-primary)' }}
                    >
                      {data.winZScore >= 0 ? '+' : ''}{data.winZScore.toFixed(2)}
                    </span>
                    {data.winZScore >= 1.0 && <TrendingUp className="inline w-3 h-3 ml-1 text-emerald-500" />}
                    {data.winZScore <= -1.0 && <TrendingDown className="inline w-3 h-3 ml-1 text-red-400" />}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: data.horse.efficiency.color,
                        color: 'white',
                      }}
                    >
                      {data.efficiency}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    {data.recommendation && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        data.recommendation === '激熱' ? 'bg-amber-500/20 text-amber-400' :
                        data.recommendation === '妙味大' ? 'bg-emerald-500/20 text-emerald-400' :
                        data.recommendation === '妙味あり' ? 'bg-blue-500/20 text-blue-400' :
                        data.recommendation === '軸候補' ? 'bg-purple-500/20 text-purple-400' :
                        data.recommendation === '過剰人気' ? 'bg-red-500/20 text-red-400' :
                        data.recommendation === '割高' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {data.recommendation}
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 妙味馬まとめ */}
      {valueBetCount > 0 && (
        <div className="p-4 rounded-xl border-2 border-emerald-500/30" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h4 className="text-sm font-bold mb-2 text-emerald-500">妙味あり候補（Z値+0.8以上 & 効率A以上）</h4>
          <div className="flex flex-wrap gap-2">
            {evData.filter(d => d.isValueBet).map(data => (
              <div
                key={data.horse.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <span
                  className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: data.bracketColor.bg,
                    color: data.bracketColor.text,
                    border: data.bracketColor.bg === '#FFFFFF' ? '1px solid #374151' : 'none',
                  }}
                >
                  {data.horse.number}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {data.horse.name}
                </span>
                <span className="text-xs text-emerald-500 font-bold">
                  Z{data.winZScore >= 0 ? '+' : ''}{data.winZScore.toFixed(1)}
                </span>
                <span
                  className="text-xs px-1 rounded font-bold"
                  style={{ backgroundColor: data.horse.efficiency.color, color: 'white' }}
                >
                  {data.efficiency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 過剰人気馬の警告 */}
      {overhypedCount > 0 && (
        <div className="p-4 rounded-xl border-2 border-red-500/30" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h4 className="text-sm font-bold mb-2 text-red-400">過剰人気（消し候補）</h4>
          <div className="flex flex-wrap gap-2">
            {evData.filter(d => d.recommendation === '過剰人気').map(data => (
              <div
                key={data.horse.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-card)' }}
              >
                <span
                  className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                  style={{
                    backgroundColor: data.bracketColor.bg,
                    color: data.bracketColor.text,
                    border: data.bracketColor.bg === '#FFFFFF' ? '1px solid #374151' : 'none',
                  }}
                >
                  {data.horse.number}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {data.horse.name}
                </span>
                <span className="text-xs text-red-400 font-bold">
                  Z{data.winZScore.toFixed(1)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  (市場{(data.marketShare * 100).toFixed(0)}% vs AI{(data.aiWinShare * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
