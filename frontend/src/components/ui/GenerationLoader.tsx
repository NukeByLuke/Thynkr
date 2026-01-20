import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';

interface GenerationLoaderProps {
  isVisible: boolean;
  stages?: string[];
  size?: 'sm' | 'md' | 'lg';
}

const defaultStages = [
  'Parsing...',
  'Synthesizing...',
  'Optimizing...',
  'Compiling...',
  'Rendering...',
];

/**
 * GenerationLoader - Quantum Orbit Animation
 * 
 * High-frequency, GPU-accelerated loading animation featuring:
 * - 3 orbiting particles (Cyan, Purple, Amber) at different speeds
 * - Morphing particles with liquid-metal energy feel
 * - Rapid text cycler with snappy transitions (800ms)
 * 
 * Performance optimizations:
 * - Uses transform and opacity only (GPU-accelerated)
 * - will-change hints for browser optimization
 * - 60fps smooth animations
 */
export default function GenerationLoader({
  isVisible,
  stages = defaultStages,
  size = 'md',
}: GenerationLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  // Rapid text cycling every 800ms
  useEffect(() => {
    if (!isVisible) {
      setCurrentStageIndex(0);
      return;
    }

    const cycleInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % stages.length);
    }, 800);

    return () => clearInterval(cycleInterval);
  }, [isVisible, stages.length]);

  const getSizeClasses = useCallback(() => {
    switch (size) {
      case 'sm': return { orbit: 'w-12 h-12', particle: 'w-2 h-2' };
      case 'lg': return { orbit: 'w-24 h-24', particle: 'w-4 h-4' };
      default: return { orbit: 'w-16 h-16', particle: 'w-3 h-3' };
    }
  }, [size]);

  if (!isVisible) return null;

  const sizeClasses = getSizeClasses();

  // Particle configurations with different orbital speeds and colors
  const particles = [
    { 
      color: 'bg-cyan-400', 
      shadow: 'shadow-cyan-400/60',
      duration: 0.8, 
      delay: 0,
      radius: 100 
    },
    { 
      color: 'bg-violet-500', 
      shadow: 'shadow-violet-500/60',
      duration: 1.2, 
      delay: 0.1,
      radius: 100 
    },
    { 
      color: 'bg-amber-400', 
      shadow: 'shadow-amber-400/60',
      duration: 1.5, 
      delay: 0.2,
      radius: 100 
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Quantum Orbit Animation */}
      <div className={clsx('relative', sizeClasses.orbit)}>
        {/* Central anchor glow */}
        <motion.div
          className="absolute inset-0 m-auto w-2 h-2 bg-white/20 rounded-full blur-sm"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3] 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />

        {/* Orbiting particles */}
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{ willChange: 'transform' }}
            animate={{ rotate: 360 }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: particle.delay,
            }}
          >
            {/* The actual particle with morphing effect */}
            <motion.div
              className={clsx(
                'absolute left-1/2 -translate-x-1/2 rounded-full shadow-lg',
                sizeClasses.particle,
                particle.color,
                particle.shadow
              )}
              style={{ 
                top: 0,
                willChange: 'transform, border-radius',
              }}
              animate={{
                scale: [1, 1.4, 0.8, 1.2, 1],
                borderRadius: ['50%', '40%', '50%', '35%', '50%'],
              }}
              transition={{
                duration: particle.duration * 0.8,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </motion.div>
        ))}

        {/* Energy trail effect */}
        <motion.div
          className="absolute inset-2 rounded-full border border-cyan-500/20"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: -360,
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          style={{ willChange: 'transform, opacity' }}
        />
      </div>

      {/* Rapid Text Cycler with popLayout transitions */}
      <div className="h-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentStageIndex}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ 
              duration: 0.15, 
              ease: [0.32, 0.72, 0, 1] 
            }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-amber-400"
            style={{ willChange: 'transform, opacity' }}
          >
            {stages[currentStageIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Pulsing energy bar */}
      <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 via-violet-500 to-amber-400 rounded-full"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{ 
            width: '60%',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
}
