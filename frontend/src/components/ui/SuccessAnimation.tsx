import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';

interface SuccessAnimationProps {
  message?: string;
  show: boolean;
  onComplete?: () => void;
  variant?: 'confetti' | 'sparkle' | 'check';
  inline?: boolean;
}

export default function SuccessAnimation({
  message = 'Success!',
  show,
  onComplete,
  variant = 'sparkle',
  inline = false,
}: SuccessAnimationProps) {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; color: string }>
  >([]);

  useEffect(() => {
    if (show && variant === 'confetti') {
      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 50,
        color: ['#4F46E5', '#22D3EE', '#6366F1', '#8B5CF6'][Math.floor(Math.random() * 4)],
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, variant, onComplete]);

  if (!show) return null;

  if (variant === 'confetti') {
    const confettiContainerClasses = inline
      ? 'absolute inset-0 pointer-events-none z-50 flex items-center justify-center'
      : 'fixed inset-0 pointer-events-none z-50 flex items-center justify-center';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={confettiContainerClasses}
      >
        {/* Confetti particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: particle.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: particle.x * 3,
              y: particle.y + 200,
              opacity: 0,
              scale: 0.5,
              rotate: Math.random() * 360,
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Success message */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl px-8 py-6 flex items-center gap-4 border border-slate-200 dark:border-white/10"
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
          <span className="text-xl font-semibold text-gray-900 dark:text-white">{message}</span>
        </motion.div>
      </motion.div>
    );
  }

  if (variant === 'sparkle') {
    const sparkleContainerClasses = inline
      ? 'relative z-10 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3'
      : 'fixed top-24 right-8 z-50 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={sparkleContainerClasses}
      >
        <motion.div
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: 2,
          }}
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
        <span className="font-semibold">{message}</span>

        {/* Sparkle particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 8) * 40,
              y: Math.sin((i * Math.PI * 2) / 8) * 40,
              opacity: 0,
              scale: [1, 2, 0],
            }}
            transition={{
              duration: 0.8,
              delay: i * 0.05,
            }}
          />
        ))}
      </motion.div>
    );
  }

  // Check variant
  const checkContainerClasses = inline
    ? 'relative z-10 bg-emerald-600 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 border border-emerald-500/40'
    : 'fixed top-24 right-8 z-50 bg-green-500 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={checkContainerClasses}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <CheckCircle className="w-6 h-6" />
      </motion.div>
      <span className="font-semibold">{message}</span>
    </motion.div>
  );
}
