import { useState } from 'react';
import { motion } from 'framer-motion';
import { Race } from '../types';
import { RaceResult } from '../types/raceResults';
import { IchigekiScanResult } from '../hooks/useIchigekiScan';
import CrossRaceComparison from './summary/CrossRaceComparison';
import TodaysPayouts from './summary/TodaysPayouts';
import RaceReview from './summary/RaceReview';

interface SummaryViewProps {
  races: Race[];
  ichigekiScanResults: IchigekiScanResult[];
  getResultByVenueRound: (venue: string, round: number) => RaceResult | undefined;
  onRaceSelect: (race: Race) => void;
}

type SummaryTab = 'comparison' | 'payouts' | 'review';

export default function SummaryView({ races, ichigekiScanResults, getResultByVenueRound, onRaceSelect }: SummaryViewProps) {
  const [tab, setTab] = useState<SummaryTab>('comparison');

  const tabs: { key: SummaryTab; label: string }[] = [
    { key: 'comparison', label: 'レース間比較' },
    { key: 'payouts', label: '払戻一覧' },
    { key: 'review', label: '振り返り' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(t => (
          <motion.button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-emerald-500 text-white'
                : 'border border-[var(--border)]'
            }`}
            style={{ color: tab === t.key ? undefined : 'var(--text-secondary)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      {tab === 'comparison' && (
        <CrossRaceComparison
          races={races}
          ichigekiScanResults={ichigekiScanResults}
          onRaceSelect={onRaceSelect}
        />
      )}
      {tab === 'payouts' && (
        <TodaysPayouts
          races={races}
          getResultByVenueRound={getResultByVenueRound}
        />
      )}
      {tab === 'review' && (
        <RaceReview
          races={races}
          getResultByVenueRound={getResultByVenueRound}
        />
      )}
    </div>
  );
}
