import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Horse } from '../types';
import { getBracketColor } from '../lib/bracket-utils';

interface MultiHorseComparisonModalProps {
  horses: Horse[];
  isOpen: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
};

export default function MultiHorseComparisonModal({
  horses,
  isOpen,
  onClose,
}: MultiHorseComparisonModalProps) {
  const [selectedHorses, setSelectedHorses] = useState<Horse[]>([]);

  const handleAddHorse = (horse: Horse) => {
    if (selectedHorses.length < 5 && !selectedHorses.find(h => h.id === horse.id)) {
      setSelectedHorses([...selectedHorses, horse]);
    }
  };

  const handleRemoveHorse = (horseId: string) => {
    setSelectedHorses(selectedHorses.filter(h => h.id !== horseId));
  };

  const handleClose = () => {
    setSelectedHorses([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            onClick={handleClose}
          />

          <motion.div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
            variants={modalVariants}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 p-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  レーダーチャート比較
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                    (最大5頭)
                  </span>
                </h2>
                <motion.button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                </motion.button>
              </div>

              {/* Selected Horses */}
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedHorses.map((horse) => {
                  const bracketColor = getBracketColor(horse.number, horses.length);
                  return (
                  <motion.div
                    key={horse.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: bracketColor.bg + '30', border: `2px solid ${bracketColor.bg}` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold border"
                      style={{
                        backgroundColor: bracketColor.bg,
                        color: bracketColor.text,
                        borderColor: bracketColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                      }}
                    >
                      {horse.number}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {horse.name}
                    </span>
                    <button
                      onClick={() => handleRemoveHorse(horse.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </motion.div>
                  );
                })}
                {selectedHorses.length === 0 && (
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    下のリストから馬を選択してください
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 grid md:grid-cols-2 gap-6">
              {/* Horse Selection List */}
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  馬を選択
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {horses.map((horse) => {
                    const isSelected = selectedHorses.some(h => h.id === horse.id);
                    const bColor = getBracketColor(horse.number, horses.length);
                    return (
                      <motion.button
                        key={horse.id}
                        onClick={() => handleAddHorse(horse)}
                        disabled={isSelected || selectedHorses.length >= 5}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                          ${isSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : selectedHorses.length >= 5
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-emerald-500/10'
                          }
                        `}
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                        whileHover={!isSelected && selectedHorses.length < 5 ? { scale: 1.01 } : {}}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold border-2"
                          style={{
                            backgroundColor: bColor.bg,
                            color: bColor.text,
                            borderColor: bColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                          }}
                        >
                          {horse.number}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {horse.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {horse.jockey} / PWR{horse.powerRank}位
                          </div>
                        </div>
                        {!isSelected && selectedHorses.length < 5 && (
                          <Plus className="w-5 h-5 text-emerald-500" />
                        )}
                        {isSelected && (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
                            選択中
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Radar Chart */}
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  能力比較チャート
                </h3>
                <div
                  className="p-4 rounded-2xl"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  {selectedHorses.length > 0 ? (
                    <MultiRadarChart horses={selectedHorses} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}>
                      馬を選択するとチャートが表示されます
                    </div>
                  )}
                </div>

                {/* Stats Table */}
                {selectedHorses.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="py-2 px-1 text-left whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>馬</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>AI単勝</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>AI連対</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>AI複勝</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>最終Sc</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>Mining</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>基礎Sc</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>R評価</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>前走ZI</th>
                          <th className="py-2 px-1 text-right whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>総合力</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHorses.map((horse) => {
                          const tColor = getBracketColor(horse.number, horses.length);
                          return (
                          <tr key={horse.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-2 px-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center flex-shrink-0 border"
                                  style={{
                                    backgroundColor: tColor.bg,
                                    color: tColor.text,
                                    borderColor: tColor.bg === '#FFFFFF' ? '#999' : 'transparent',
                                  }}
                                >
                                  {horse.number}
                                </span>
                                <span className="truncate max-w-[60px]" style={{ color: 'var(--text-primary)' }}>{horse.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#ef4444' }}>
                              {(horse.predictions.win_rate * 100).toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#3b82f6' }}>
                              {(horse.predictions.place_rate * 100).toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#22c55e' }}>
                              {(horse.predictions.show_rate * 100).toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#8b5cf6' }}>
                              {horse.indices.final_score.toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#06b6d4' }}>
                              {horse.indices.mining_index.toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#a855f7' }}>
                              {horse.indices.base_score.toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#f97316' }}>
                              {horse.indices.corrected_time_deviation.toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#14b8a6' }}>
                              {horse.indices.zi_deviation.toFixed(1)}
                            </td>
                            <td className="py-2 px-1 text-right font-mono" style={{ color: '#f59e0b' }}>
                              {horse.powerScore.toFixed(0)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 複数馬のレーダーチャート（総合力はスケールが異なるため除外）
function MultiRadarChart({ horses }: { horses: Horse[] }) {
  const labels = ['AI単勝', 'AI連対', 'AI複勝', '最終Sc', 'Mining', '基礎Sc', 'R評価', '前走ZI'];

  const data = labels.map((label, index) => {
    const entry: Record<string, string | number> = { subject: label };
    horses.forEach((horse) => {
      let value = 0;
      switch (index) {
        case 0: value = horse.predictions.win_rate * 100; break;
        case 1: value = horse.predictions.place_rate * 100; break;
        case 2: value = horse.predictions.show_rate * 100; break;
        case 3: value = horse.indices.final_score; break;
        case 4: value = horse.indices.mining_index; break;
        case 5: value = horse.indices.base_score; break;
        case 6: value = Math.max(0, Math.min(100, 50 + horse.indices.corrected_time_deviation * 10)); break;
        case 7: value = Math.max(0, Math.min(100, 50 + horse.indices.zi_deviation * 10)); break;
      }
      entry[horse.name] = value;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
        {horses.map((horse) => (
          <Radar
            key={horse.id}
            name={`${horse.number}${horse.name}`}
            dataKey={horse.name}
            stroke={horse.color}
            fill={horse.color}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value: string) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
