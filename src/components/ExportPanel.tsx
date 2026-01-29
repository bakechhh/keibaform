import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Image, Loader2, CheckCircle, X } from 'lucide-react';
import { useImageExport } from '../hooks/useImageExport';

interface ExportTarget {
  id: string;
  name: string;
  ref: React.RefObject<HTMLElement | null>;
}

interface ExportPanelProps {
  targets: ExportTarget[];
  raceInfo?: {
    raceName: string;
    date: string;
  };
}

export default function ExportPanel({ targets, raceInfo }: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<Record<string, 'idle' | 'exporting' | 'done'>>({});
  const { isExporting, exportElement, exportMultiple } = useImageExport();

  const getFileName = (name: string) => {
    const prefix = raceInfo ? `${raceInfo.date}_${raceInfo.raceName}` : 'umaai';
    return `${prefix}_${name}`.replace(/[\/\\:*?"<>|]/g, '_');
  };

  const handleExportSingle = async (target: ExportTarget) => {
    setExportStatus(prev => ({ ...prev, [target.id]: 'exporting' }));

    const success = await exportElement(target.ref.current, {
      fileName: getFileName(target.name),
    });

    setExportStatus(prev => ({ ...prev, [target.id]: success ? 'done' : 'idle' }));

    // 3秒後にステータスをリセット
    setTimeout(() => {
      setExportStatus(prev => ({ ...prev, [target.id]: 'idle' }));
    }, 3000);
  };

  const handleExportAll = async () => {
    const exportItems = targets
      .filter(t => t.ref.current)
      .map(t => ({
        element: t.ref.current,
        name: getFileName(t.name),
      }));

    // 全てをexporting状態に
    const newStatus: Record<string, 'idle' | 'exporting' | 'done'> = {};
    targets.forEach(t => {
      newStatus[t.id] = 'exporting';
    });
    setExportStatus(newStatus);

    await exportMultiple(exportItems);

    // 全てをdone状態に
    targets.forEach(t => {
      newStatus[t.id] = 'done';
    });
    setExportStatus({ ...newStatus });

    // 3秒後にリセット
    setTimeout(() => {
      setExportStatus({});
    }, 3000);
  };

  return (
    <div className="relative">
      {/* トリガーボタン */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Image className="w-4 h-4" />
        )}
        画像出力
      </motion.button>

      {/* ドロップダウン */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ - モバイルでは半透明背景 */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 sm:bg-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* メニュー - モバイルでは固定位置で中央に */}
            <motion.div
              className="fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 sm:mt-2 w-[90vw] sm:w-64 max-w-[300px] rounded-xl shadow-xl z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* ヘッダー */}
              <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  画像エクスポート
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-[var(--bg-secondary)]"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
              </div>

              {/* 一括エクスポート */}
              <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <motion.button
                  onClick={handleExportAll}
                  disabled={isExporting}
                  className="w-full p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-emerald-500 text-white disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  全てエクスポート ({targets.length}項目)
                </motion.button>
              </div>

              {/* 個別エクスポート */}
              <div className="max-h-[300px] overflow-y-auto">
                {targets.map(target => (
                  <motion.button
                    key={target.id}
                    onClick={() => handleExportSingle(target)}
                    disabled={isExporting || exportStatus[target.id] === 'exporting'}
                    className="w-full p-3 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
                    whileHover={{ x: 2 }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {target.name}
                    </span>
                    {exportStatus[target.id] === 'exporting' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : exportStatus[target.id] === 'done' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Download className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* フッター */}
              <div className="p-2 border-t text-xs text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                PNG形式でダウンロードされます
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// エクスポート用のラッパーコンポーネント
export function ExportableSection({
  id,
  children,
  registerRef,
}: {
  id: string;
  children: React.ReactNode;
  registerRef: (id: string, ref: React.RefObject<HTMLDivElement | null>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // 親コンポーネントにrefを登録
  useState(() => {
    registerRef(id, ref);
  });

  return (
    <div ref={ref} data-export-id={id}>
      {children}
    </div>
  );
}
