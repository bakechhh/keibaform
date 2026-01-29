import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Race } from '../types';

interface RaceNavigationProps {
  races: Race[];
  allRaces: Race[]; // 全レース（開催場所切り替え用）
  selectedRace: Race | null;
  onSelect: (race: Race) => void;
}

export default function RaceNavigation({
  races,
  allRaces,
  selectedRace,
  onSelect,
}: RaceNavigationProps) {
  if (!selectedRace) return null;

  // 現在のレースのインデックス
  const currentIndex = races.findIndex(r => r.id === selectedRace.id);

  // 前後のレース
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < races.length - 1;

  // 同じラウンドの他の開催場所
  const sameRoundOtherVenues = allRaces.filter(
    r => r.round === selectedRace.round && r.location !== selectedRace.location
  );

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelect(races[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelect(races[currentIndex + 1]);
    }
  };

  const handleVenueSwitch = (venue: string) => {
    const targetRace = sameRoundOtherVenues.find(r => r.location === venue);
    if (targetRace) {
      onSelect(targetRace);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 前のレース */}
      <motion.button
        onClick={handlePrevious}
        disabled={!hasPrevious}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
          ${hasPrevious
            ? 'bg-[var(--bg-secondary)] hover:bg-emerald-500/20'
            : 'opacity-40 cursor-not-allowed'
          }
        `}
        style={{ color: 'var(--text-secondary)' }}
        whileHover={hasPrevious ? { scale: 1.02 } : {}}
        whileTap={hasPrevious ? { scale: 0.98 } : {}}
      >
        <ChevronLeft className="w-4 h-4" />
        前のR
      </motion.button>

      {/* 現在位置 */}
      <span className="text-xs font-medium px-2" style={{ color: 'var(--text-secondary)' }}>
        {currentIndex + 1} / {races.length}
      </span>

      {/* 次のレース */}
      <motion.button
        onClick={handleNext}
        disabled={!hasNext}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
          ${hasNext
            ? 'bg-[var(--bg-secondary)] hover:bg-emerald-500/20'
            : 'opacity-40 cursor-not-allowed'
          }
        `}
        style={{ color: 'var(--text-secondary)' }}
        whileHover={hasNext ? { scale: 1.02 } : {}}
        whileTap={hasNext ? { scale: 0.98 } : {}}
      >
        次のR
        <ChevronRight className="w-4 h-4" />
      </motion.button>

      {/* 開催場所切り替え */}
      {sameRoundOtherVenues.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          <ArrowLeftRight className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
          <select
            value=""
            onChange={(e) => handleVenueSwitch(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs border cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">同R他場</option>
            {sameRoundOtherVenues.map((race, index) => (
              <option key={`${race.id}-${index}`} value={race.location}>
                {race.location}{race.round}R
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
