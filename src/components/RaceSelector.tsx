import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Ruler, Users, ChevronDown, Grid3X3, List, Clock } from 'lucide-react';
import { Race } from '../types';
import { SkipBadge } from './SkipChecker';

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

type ViewType = 'dropdown' | 'grid';

export default function RaceSelector({ races, selectedRace, onSelect }: RaceSelectorProps) {
  const [viewType, setViewType] = useState<ViewType>('dropdown');

  return (
    <div className="space-y-3">
      {/* View Toggle & Dropdown */}
      <div className="flex items-center gap-3">
        {/* Dropdown Selector */}
        <div className="flex-1 relative">
          <select
            value={selectedRace?.id || ''}
            onChange={(e) => {
              const race = races.find(r => r.id === e.target.value);
              if (race) onSelect(race);
            }}
            className="w-full px-4 py-3 pr-10 rounded-xl text-base font-medium border cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {races.map((race, index) => {
              const skipLabel = race.skipCheck?.shouldSkip ? ' [見送り]'
                : race.skipCheck && race.skipCheck.reasons.length > 0 ? ' [注意]'
                : race.skipCheck ? ' [買い]'
                : '';
              return (
                <option key={`${race.id}-${index}`} value={race.id}>
                  {race.startTime ? `${race.startTime} ` : ''}{race.location}{race.round}R {race.name} ({race.surface}{race.distance}m / {race.horses.length}頭) {race.evaluation?.label || ''}{skipLabel}
                </option>
              );
            })}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {/* View Type Toggle */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setViewType('dropdown')}
            className={`p-2 rounded-lg transition-colors ${viewType === 'dropdown' ? 'bg-emerald-500 text-white' : ''}`}
            style={{ color: viewType === 'dropdown' ? undefined : 'var(--text-secondary)' }}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewType('grid')}
            className={`p-2 rounded-lg transition-colors ${viewType === 'grid' ? 'bg-emerald-500 text-white' : ''}`}
            style={{ color: viewType === 'grid' ? undefined : 'var(--text-secondary)' }}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Race Info Card */}
      {selectedRace && viewType === 'dropdown' && (
        <motion.div
          className="p-4 rounded-2xl border-2 border-emerald-500"
          style={{ backgroundColor: 'var(--bg-card)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${gradeColors[selectedRace.grade] || gradeColors['OP']}`}>
                  {selectedRace.grade}
                </span>
                {selectedRace.evaluation && (
                  <span
                    className="px-2 py-1 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: selectedRace.evaluation.color }}
                  >
                    {selectedRace.evaluation.label}
                  </span>
                )}
                <SkipBadge race={selectedRace} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {selectedRace.name}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedRace.location}{selectedRace.round}R
                </span>
                {selectedRace.startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedRace.startTime}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  {selectedRace.surface}{selectedRace.distance}m
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {selectedRace.horses.length}頭
                </span>
                <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {selectedRace.condition}
                </span>
                {selectedRace.trackCondition && (
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    selectedRace.trackCondition === '良' ? 'bg-green-500/20 text-green-400' :
                    selectedRace.trackCondition === '稍重' ? 'bg-yellow-500/20 text-yellow-400' :
                    selectedRace.trackCondition === '重' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedRace.trackCondition}
                  </span>
                )}
              </div>
            </div>
          </div>
          {selectedRace.evaluation && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {selectedRace.evaluation.description}
            </p>
          )}
          {selectedRace.skipCheck && (
            <p className="mt-1 text-xs" style={{
              color: selectedRace.skipCheck.shouldSkip ? '#ef4444'
                : selectedRace.skipCheck.reasons.length > 0 ? '#f59e0b'
                : '#22c55e'
            }}>
              {selectedRace.skipCheck.summary}
            </p>
          )}
        </motion.div>
      )}

      {/* Grid View */}
      {viewType === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {races.map((race, index) => (
            <motion.button
              key={`${race.id}-${index}`}
              onClick={() => onSelect(race)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-3 rounded-xl border-2 text-left transition-all
                ${selectedRace?.id === race.id
                  ? 'border-emerald-500'
                  : 'border-[var(--border)] hover:border-emerald-400/50'
                }
              `}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold bg-gradient-to-r ${gradeColors[race.grade] || gradeColors['OP']}`}>
                  {race.grade}
                </span>
                {race.evaluation && (
                  <span
                    className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold"
                    style={{ backgroundColor: race.evaluation.color }}
                  >
                    {race.evaluation.label}
                  </span>
                )}
                <SkipBadge race={race} />
              </div>
              <div className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {race.round}R {race.name}
                {race.startTime && (
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
                    {race.startTime}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {race.surface}{race.distance}m / {race.horses.length}頭
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
