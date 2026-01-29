import { motion } from 'framer-motion';
import { Calendar, MapPin, Filter } from 'lucide-react';
import { RaceFilterState } from '../types';

interface RaceFiltersProps {
  filters: RaceFilterState;
  onFilterChange: (filters: RaceFilterState) => void;
  availableDates: string[];
  availableVenues: string[];
}

export default function RaceFilters({
  filters,
  onFilterChange,
  availableDates,
  availableVenues,
}: RaceFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          フィルター:
        </span>
      </div>

      {/* Date Dropdown */}
      <div className="relative">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <motion.select
            value={filters.date || ''}
            onChange={(e) => onFilterChange({ ...filters, date: e.target.value || null })}
            className="appearance-none bg-transparent border rounded-lg px-3 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card)',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <option value="">すべての日付</option>
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </motion.select>
        </div>
      </div>

      {/* Venue Dropdown */}
      <div className="relative">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <motion.select
            value={filters.venue || ''}
            onChange={(e) => onFilterChange({ ...filters, venue: e.target.value || null })}
            className="appearance-none bg-transparent border rounded-lg px-3 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-card)',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <option value="">すべての場所</option>
            {availableVenues.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </motion.select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.date || filters.venue) && (
        <motion.button
          onClick={() => onFilterChange({ date: null, venue: null })}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          クリア
        </motion.button>
      )}
    </div>
  );
}
