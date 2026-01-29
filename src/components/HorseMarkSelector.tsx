import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { HORSE_MARKS, MARK_COLORS, HorseMark } from '../hooks/useHorseMarks';

interface HorseMarkSelectorProps {
  currentMark: HorseMark;
  onSelect: (mark: HorseMark) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HorseMarkSelector({
  currentMark,
  onSelect,
  isOpen,
  onClose,
}: HorseMarkSelectorProps) {
  const handleSelect = (mark: HorseMark) => {
    onSelect(mark);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Selector */}
          <motion.div
            className="absolute z-50 p-2 rounded-xl shadow-xl border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
          >
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                印を選択
              </span>
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded hover:bg-gray-500/20"
              >
                <X className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <div className="flex gap-1">
              {HORSE_MARKS.map(mark => {
                const colors = MARK_COLORS[mark];
                const isSelected = currentMark === mark;

                return (
                  <motion.button
                    key={mark}
                    onClick={() => handleSelect(mark)}
                    className={`
                      w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center
                      ${isSelected ? 'ring-2 ring-white ring-offset-1' : ''}
                    `}
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={colors.label}
                  >
                    {mark}
                  </motion.button>
                );
              })}

              {/* Clear button */}
              {currentMark && (
                <motion.button
                  onClick={() => handleSelect(null)}
                  className="w-8 h-8 rounded-lg text-xs flex items-center justify-center border"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title="クリア"
                >
                  ×
                </motion.button>
              )}
            </div>

            {/* Label hints */}
            <div className="mt-2 flex flex-wrap gap-1">
              {HORSE_MARKS.slice(0, 4).map(mark => (
                <span
                  key={mark}
                  className="text-[9px] px-1 rounded"
                  style={{
                    backgroundColor: MARK_COLORS[mark].bg + '30',
                    color: MARK_COLORS[mark].bg,
                  }}
                >
                  {mark}{MARK_COLORS[mark].label}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 印バッジコンポーネント（表示用）
interface HorseMarkBadgeProps {
  mark: HorseMark;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showLabel?: boolean;
}

export function HorseMarkBadge({ mark, size = 'md', onClick, showLabel = false }: HorseMarkBadgeProps) {
  if (!mark) return null;

  const colors = MARK_COLORS[mark];
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const badge = (
    <motion.span
      className={`
        ${sizeClasses[size]} rounded font-bold flex items-center justify-center
        ${onClick ? 'cursor-pointer' : ''}
      `}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {mark}
    </motion.span>
  );

  if (showLabel) {
    return (
      <div className="flex items-center gap-1">
        {badge}
        <span className="text-xs" style={{ color: colors.bg }}>
          {colors.label}
        </span>
      </div>
    );
  }

  return badge;
}

// 印選択ボタン（空の場合も表示）
interface HorseMarkButtonProps {
  mark: HorseMark;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function HorseMarkButton({ mark, onClick, size = 'md' }: HorseMarkButtonProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  if (mark) {
    const colors = MARK_COLORS[mark];
    return (
      <motion.button
        className={`${sizeClasses[size]} rounded font-bold flex items-center justify-center`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        title="印を変更"
      >
        {mark}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={`${sizeClasses[size]} rounded border-2 border-dashed flex items-center justify-center`}
      style={{
        borderColor: 'var(--border)',
        color: 'var(--text-secondary)',
      }}
      whileHover={{ scale: 1.1, borderColor: '#10b981' }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      title="印をつける"
    >
      +
    </motion.button>
  );
}

// インライン印セレクター（直接タップで切り替え）
interface InlineMarkSelectorProps {
  currentMark: HorseMark;
  onSelect: (mark: HorseMark) => void;
  compact?: boolean;
}

export function InlineMarkSelector({ currentMark, onSelect, compact = false }: InlineMarkSelectorProps) {
  const handleClick = (e: React.MouseEvent, mark: typeof HORSE_MARKS[number]) => {
    e.stopPropagation();
    // 同じ印をクリックしたらクリア、違う印ならセット
    onSelect(currentMark === mark ? null : mark);
  };

  const sizeClass = compact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs';

  return (
    <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
      {HORSE_MARKS.map(mark => {
        const colors = MARK_COLORS[mark];
        const isSelected = currentMark === mark;

        return (
          <motion.button
            key={mark}
            onClick={(e) => handleClick(e, mark)}
            className={`
              ${sizeClass} rounded font-bold flex items-center justify-center
              ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800' : 'opacity-40 hover:opacity-100'}
            `}
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            {mark}
          </motion.button>
        );
      })}
    </div>
  );
}

// ドロップダウン式印セレクター（テーブル用・省スペース）
interface DropdownMarkSelectorProps {
  currentMark: HorseMark;
  onSelect: (mark: HorseMark) => void;
}

export function DropdownMarkSelector({ currentMark, onSelect }: DropdownMarkSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const value = e.target.value;
    onSelect(value === '' ? null : value as HorseMark);
  };

  const currentColor = currentMark ? MARK_COLORS[currentMark] : null;

  return (
    <select
      value={currentMark || ''}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      className="w-10 h-6 text-xs font-bold rounded text-center cursor-pointer appearance-none border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      style={{
        backgroundColor: currentColor?.bg || 'var(--bg-secondary)',
        color: currentColor?.text || 'var(--text-secondary)',
      }}
    >
      <option value="">-</option>
      {HORSE_MARKS.map(mark => (
        <option key={mark} value={mark}>
          {mark}
        </option>
      ))}
    </select>
  );
}
