import { motion } from 'framer-motion';
import { Trophy, MapPin, Ruler, Users } from 'lucide-react';
import { Race } from '../types';

interface RaceSelectorProps {
  races: Race[];
  selectedRace: Race | null;
  onSelect: (race: Race) => void;
}

const gradeColors: Record<string, string> = {
  G1: 'from-yellow-400 to-amber-500',
  G2: 'from-pink-400 to-rose-500',
  G3: 'from-emerald-400 to-green-500',
  OP: 'from-blue-400 to-indigo-500',
  '新馬': 'from-cyan-400 to-teal-500',
  '未勝利': 'from-purple-400 to-violet-500',
  '1勝': 'from-gray-400 to-slate-500',
  '2勝': 'from-orange-400 to-amber-500',
  '3勝': 'from-red-400 to-rose-500',
};


export default function RaceSelector({ races, selectedRace, onSelect }: RaceSelectorProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-thin">
      {races.map((race, index) => (
        <motion.button
          key={race.id}
          onClick={() => onSelect(race)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative min-w-[300px] p-4 rounded-2xl border-2 transition-all duration-300 text-left
            ${selectedRace?.id === race.id
              ? 'border-emerald-500 glow-green'
              : 'border-[var(--border)] hover:border-emerald-400/50'
            }
          `}
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Grade Badge */}
          <div className={`
            absolute -top-3 -right-2 px-3 py-1 rounded-full text-white text-sm font-bold
            bg-gradient-to-r ${gradeColors[race.grade] || gradeColors['OP']}
            shadow-lg
          `}>
            {race.grade}
          </div>

          {/* Race Evaluation Badge */}
          {race.evaluation && (
            <div
              className="absolute -top-3 left-4 px-2 py-1 rounded-full text-white text-xs font-bold"
              style={{ backgroundColor: race.evaluation.color }}
            >
              {race.evaluation.label}
            </div>
          )}

          {/* Race Name */}
          <div className="flex items-center gap-2 mb-2 mt-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {race.name}
            </h3>
          </div>

          {/* Race Details */}
          <div className="flex flex-wrap gap-3 text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{race.location}{race.round}R</span>
            </div>
            <div className="flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              <span>{race.surface}{race.distance}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{race.horses.length}頭</span>
            </div>
          </div>

          {/* Condition & Evaluation Description */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              馬場: {race.condition}
            </span>
            {race.evaluation && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {race.evaluation.description}
              </span>
            )}
          </div>

          {/* Selection Indicator */}
          {selectedRace?.id === race.id && (
            <motion.div
              layoutId="selector"
              className="absolute inset-0 rounded-2xl border-2 border-emerald-500 pointer-events-none"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
