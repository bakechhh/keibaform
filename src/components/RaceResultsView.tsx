import { motion } from 'framer-motion';
import { Trophy, Clock, AlertCircle, Check, X as XIcon } from 'lucide-react';
import { RaceResult } from '../types/raceResults';
import { getBracketColor, bracketColors } from '../lib/bracket-utils';
import { useHorseMarksContext } from '../contexts/HorseMarksContext';
import { HorseMarkBadge } from './HorseMarkSelector';

interface RaceResultsViewProps {
  result: RaceResult | null;
  loading: boolean;
  raceName?: string;
}

export default function RaceResultsView({
  result,
  loading,
  raceName,
}: RaceResultsViewProps) {
  const { getMark } = useHorseMarksContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Clock className="w-5 h-5" />
          結果を確認中...
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-secondary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>
          {raceName ? `${raceName} の結果はまだありません` : '結果データがありません'}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          レース確定後に自動更新されます
        </p>
      </div>
    );
  }

  const data = result.data;
  // 出走頭数：馬番の最大値を使用（除外がない場合は着順数と一致）
  // 除外馬がいる場合も馬番から正しい枠番を計算できる
  const maxHorseNumber = Math.max(...data.着順.map(h => parseInt(h.馬番, 10)));
  const totalHorses = Math.max(maxHorseNumber, data.着順.length);

  // 払戻金額のフォーマット
  const formatPayout = (payout: string): string => {
    const num = parseInt(payout, 10);
    return num.toLocaleString();
  };

  // 払戻金額による色分け
  const getPayoutColor = (payout: string): string => {
    const num = parseInt(payout, 10);
    if (num >= 100000) return '#dc2626'; // 10万以上
    if (num >= 10000) return '#ef4444'; // 万馬券
    if (num >= 5000) return '#f97316'; // 5000円以上
    if (num >= 1000) return '#eab308'; // 1000円以上
    return 'var(--text-primary)';
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>
            {data.開催場所} {data.レース番号}R 結果
          </h4>
        </div>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {data.date}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 着順（縦並び） */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            着順
          </h5>
          <div className="space-y-2">
            {data.着順.map((horse, index) => {
              const horseNum = parseInt(horse.馬番, 10);
              const bracketColor = getBracketColor(horseNum, totalHorses);
              const horseMark = getMark(horse.馬名);

              // 着順による装飾（ライト/ダーク両モードで見やすい色）
              const getRankStyle = (rank: number) => {
                if (rank === 1) return { bg: 'bg-amber-500/20', text: 'text-amber-500', label: '1着' };
                if (rank === 2) return { bg: 'bg-slate-400/20', text: 'text-slate-500 dark:text-slate-300', label: '2着' };
                if (rank === 3) return { bg: 'bg-orange-600/20', text: 'text-orange-500', label: '3着' };
                return { bg: 'bg-gray-500/10', text: 'text-gray-500 dark:text-gray-400', label: `${rank}着` };
              };

              const rankStyle = getRankStyle(index + 1);

              // 印の評価（本命◎が3着以内なら成功など）
              const isInMoney = index < 3;
              const markResult = horseMark ? (
                horseMark === '消' ? (isInMoney ? 'failed' : 'success') :
                horseMark === '✕' ? (isInMoney ? 'warning' : 'neutral') :
                (isInMoney ? 'success' : 'failed')
              ) : null;

              return (
                <motion.div
                  key={horse.馬番}
                  className={`flex items-center gap-2 p-2 rounded-lg ${rankStyle.bg}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className={`w-8 text-center font-bold ${rankStyle.text}`}>
                    {rankStyle.label}
                  </span>

                  {/* 馬印表示 */}
                  <div className="w-7 flex-shrink-0">
                    {horseMark ? (
                      <HorseMarkBadge mark={horseMark} size="sm" />
                    ) : (
                      <span className="w-5 h-5 block" />
                    )}
                  </div>

                  <span
                    className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold border flex-shrink-0"
                    style={{
                      backgroundColor: bracketColor.bg,
                      color: bracketColor.text,
                      borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                    }}
                  >
                    {horse.馬番}
                  </span>
                  <span className="font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {horse.馬名}
                  </span>

                  {/* 印の結果インジケータ */}
                  {markResult && (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        markResult === 'success' ? 'bg-emerald-500' :
                        markResult === 'failed' ? 'bg-red-500' :
                        markResult === 'warning' ? 'bg-amber-500' :
                        'bg-gray-500'
                      }`}
                    >
                      {markResult === 'success' ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : markResult === 'failed' ? (
                        <XIcon className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-[10px] text-white">!</span>
                      )}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 印の成績サマリー */}
          <MarkSummary finishOrder={data.着順} getMark={getMark} />
        </div>

        {/* 払戻一覧（テーブル形式） */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            払戻金
          </h5>
          <div className="space-y-1">
            {/* 単勝・複勝 */}
            <PayoutRow label="単勝" items={data.払戻.単勝} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />
            <PayoutRow label="複勝" items={data.払戻.複勝} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />

            <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />

            {/* 枠連・馬連・ワイド */}
            <PayoutRow label="枠連" items={data.払戻.枠連} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />
            <PayoutRow label="馬連" items={data.払戻.馬連} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />
            <PayoutRow label="ワイド" items={data.払戻.ワイド} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />

            <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />

            {/* 馬単・3連複・3連単 */}
            <PayoutRow label="馬単" items={data.払戻.馬単} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />
            <PayoutRow label="3連複" items={data.払戻['3連複']} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} />
            <PayoutRow label="3連単" items={data.払戻['3連単']} formatPayout={formatPayout} getPayoutColor={getPayoutColor} totalHorses={totalHorses} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}

// 印の成績サマリー
function MarkSummary({
  finishOrder,
  getMark,
}: {
  finishOrder: { 馬名: string; 馬番: string }[];
  getMark: (name: string) => string | null;
}) {
  // 印がついている馬を集計
  const markedHorses = finishOrder
    .map((horse, index) => ({
      name: horse.馬名,
      rank: index + 1,
      mark: getMark(horse.馬名),
    }))
    .filter(h => h.mark !== null);

  if (markedHorses.length === 0) {
    return null;
  }

  // 本命◎が何着か
  const honmei = markedHorses.find(h => h.mark === '◎');
  // 対抗◯が何着か
  const taiko = markedHorses.find(h => h.mark === '◯');
  // 消しが来たか
  const keshi = markedHorses.filter(h => h.mark === '消' && h.rank <= 3);
  // 3着以内に入った印馬
  const inMoney = markedHorses.filter(h => h.mark !== '消' && h.mark !== '✕' && h.rank <= 3);

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        印の成績
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {honmei && (
          <span
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: honmei.rank <= 3 ? '#22c55e30' : '#ef444430',
              color: honmei.rank <= 3 ? '#22c55e' : '#ef4444',
            }}
          >
            ◎{honmei.rank}着
          </span>
        )}
        {taiko && (
          <span
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: taiko.rank <= 3 ? '#22c55e30' : '#ef444430',
              color: taiko.rank <= 3 ? '#22c55e' : '#ef4444',
            }}
          >
            ◯{taiko.rank}着
          </span>
        )}
        {inMoney.length > 0 && (
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
            的中印 {inMoney.length}頭
          </span>
        )}
        {keshi.length > 0 && (
          <span className="px-2 py-1 rounded bg-red-500/20 text-red-400">
            消し馬来た {keshi.length}頭
          </span>
        )}
      </div>
    </div>
  );
}

// 組み合わせ番号を枠番色で表示するコンポーネント
function ColoredCombination({
  combination,
  totalHorses,
  isWakuren,
}: {
  combination: string;
  totalHorses: number;
  isWakuren: boolean;
}) {
  // "1-2-3" や "1→2→3" 等のフォーマットをパース
  const parts = combination.split(/([→\-=])/);
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-sm">
      {parts.map((part, i) => {
        const num = parseInt(part, 10);
        if (!isNaN(num)) {
          if (isWakuren) {
            // 枠連は枠番なので bracketColors を直接使う
            const color = bracketColors[num] || bracketColors[1];
            return (
              <span
                key={i}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border"
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  borderColor: color.bg === '#FFFFFF' ? '#999' : 'transparent',
                }}
              >
                {num}
              </span>
            );
          } else {
            const color = getBracketColor(num, totalHorses);
            return (
              <span
                key={i}
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border"
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  borderColor: color.bg === '#FFFFFF' ? '#999' : 'transparent',
                }}
              >
                {num}
              </span>
            );
          }
        }
        // セパレータ (-, →, =)
        return (
          <span key={i} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            {part}
          </span>
        );
      })}
    </span>
  );
}

// 払戻行コンポーネント
function PayoutRow({
  label,
  items,
  formatPayout,
  getPayoutColor,
  totalHorses,
  highlight = false,
}: {
  label: string;
  items: { 払出: string; 組み合わせ: string }[];
  formatPayout: (p: string) => string;
  getPayoutColor: (p: string) => string;
  totalHorses: number;
  highlight?: boolean;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center py-1">
        <span className="w-14 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>-</span>
      </div>
    );
  }

  const isWakuren = label === '枠連';

  return (
    <div className={`py-1 ${highlight ? 'bg-amber-500/10 rounded px-2 -mx-2' : ''}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="w-14 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {index === 0 ? label : ''}
          </span>
          <span className="w-24">
            <ColoredCombination
              combination={item.組み合わせ}
              totalHorses={totalHorses}
              isWakuren={isWakuren}
            />
          </span>
          <span
            className="font-bold text-right flex-1"
            style={{ color: getPayoutColor(item.払出) }}
          >
            ¥{formatPayout(item.払出)}
          </span>
        </div>
      ))}
    </div>
  );
}
