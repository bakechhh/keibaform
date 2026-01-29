import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Loader2 } from 'lucide-react';
import { OddsDisplay } from '../types';
import OddsTable from './OddsTable';

type OddsTab = 'tansho' | 'fukusho' | 'wakuren' | 'umaren' | 'wide' | 'umatan' | 'sanrenpuku' | 'sanrentan';

interface OddsViewProps {
  odds: OddsDisplay | null;
  loading: boolean;
}

const tabs: { key: OddsTab; label: string }[] = [
  { key: 'tansho', label: '単勝' },
  { key: 'fukusho', label: '複勝' },
  { key: 'wakuren', label: '枠連' },
  { key: 'umaren', label: '馬連' },
  { key: 'wide', label: 'ワイド' },
  { key: 'umatan', label: '馬単' },
  { key: 'sanrenpuku', label: '3連複' },
  { key: 'sanrentan', label: '3連単' },
];

export default function OddsView({ odds, loading }: OddsViewProps) {
  const [activeTab, setActiveTab] = useState<OddsTab>('tansho');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!odds) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>オッズデータがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 min-w-[60px]
              ${activeTab === tab.key
                ? 'bg-emerald-500 text-white'
                : 'hover:bg-emerald-500/20'
              }
            `}
            style={{
              color: activeTab === tab.key ? undefined : 'var(--text-secondary)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <OddsTable odds={odds} type={activeTab} />
      </motion.div>
    </div>
  );
}
