import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface VenueTabsProps {
  venues: string[];
  selectedVenue: string | null;
  onSelect: (venue: string | null) => void;
}

export default function VenueTabs({ venues, selectedVenue, onSelect }: VenueTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />

      <motion.button
        onClick={() => onSelect(null)}
        className={`
          px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
          ${selectedVenue === null
            ? 'bg-emerald-500 text-white'
            : 'hover:bg-emerald-500/20'
          }
        `}
        style={{
          color: selectedVenue === null ? undefined : 'var(--text-secondary)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        すべて
      </motion.button>

      {venues.map((venue) => (
        <motion.button
          key={venue}
          onClick={() => onSelect(venue)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
            ${selectedVenue === venue
              ? 'bg-emerald-500 text-white'
              : 'hover:bg-emerald-500/20'
            }
          `}
          style={{
            color: selectedVenue === venue ? undefined : 'var(--text-secondary)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {venue}
        </motion.button>
      ))}
    </div>
  );
}
