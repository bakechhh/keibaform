import { motion } from 'framer-motion';

interface GameStatusBarProps {
  label: string;
  value: number;
  color: string;
  maxValue?: number;
  showValue?: boolean;
}

export default function GameStatusBar({
  label,
  value,
  color,
  maxValue = 100,
  showValue = true
}: GameStatusBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-10 text-xs font-bold tracking-wider"
        style={{ color: color }}
      >
        {label}
      </span>

      <div
        className="flex-1 h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 1,
            ease: 'easeOut',
            delay: 0.2
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.5,
              delay: 1,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </motion.div>
      </div>

      {showValue && (
        <motion.span
          className="w-8 text-xs font-bold text-right"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {value}
        </motion.span>
      )}
    </div>
  );
}
