import { clsx } from 'clsx';

interface BrandLoaderProps {
  dimension?: number;
  className?: string;
  highContrast?: boolean;
}

const tilePositions = [
  { left: 0, top: 0 },
  { right: 0, top: 0 },
  { left: 0, bottom: 0 },
  { right: 0, bottom: 0 },
] as const;

const tileColorClasses = [
  'from-brand-500 to-fuchsia-500 dark:from-cyan-400 dark:to-blue-500',
  'from-fuchsia-500 to-orange-400 dark:from-blue-500 dark:to-violet-500',
  'from-brand-400 to-fuchsia-400 dark:from-cyan-500 dark:to-blue-400',
  'from-orange-400 to-brand-500 dark:from-violet-500 dark:to-cyan-400',
] as const;

export default function BrandLoader({ dimension = 40, className, highContrast = false }: BrandLoaderProps) {
  const tileSize = Math.max(6, Math.round(dimension * 0.24));
  const tileGap = Math.max(2, Math.round(dimension * 0.08));
  const coreSize = tileSize * 2 + tileGap;
  const glowSize = Math.max(14, Math.round(dimension * 0.78));

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
      aria-hidden="true"
    >
      <span
        className={clsx(
          'absolute rounded-full blur-md',
          highContrast
            ? 'bg-white/25 dark:bg-cyan-300/20'
            : 'bg-gradient-to-br from-brand-300/45 via-fuchsia-300/35 to-orange-300/35 dark:from-cyan-500/30 dark:via-blue-500/25 dark:to-violet-500/25'
        )}
        style={{ width: glowSize, height: glowSize }}
      />

      <span
        className={clsx(
          'absolute rounded-full border animate-[spin_2.8s_linear_infinite]',
          highContrast
            ? 'border-white/55 dark:border-cyan-100/35'
            : 'border-brand-200/75 dark:border-cyan-300/30'
        )}
        style={{ width: glowSize + 2, height: glowSize + 2 }}
      />

      <div
        className="relative animate-[spin_1.45s_linear_infinite]"
        style={{ width: coreSize, height: coreSize }}
      >
        {tilePositions.map((position, index) => (
          <span
            key={index}
            className={clsx(
              'absolute rounded-[3px] border border-white/65 dark:border-white/15 bg-gradient-to-br shadow-sm animate-[pulse_1.05s_ease-in-out_infinite]',
              tileColorClasses[index]
            )}
            style={{
              width: tileSize,
              height: tileSize,
              transform: 'rotate(45deg)',
              animationDelay: `${index * 95}ms`,
              ...position,
            }}
          />
        ))}
      </div>
    </div>
  );
}