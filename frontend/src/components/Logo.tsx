import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  animated?: boolean;
}

export default function Logo({ variant = 'full', className, animated = true }: LogoProps) {
  const { isAuthenticated } = useAuth();

  // Route to /study (main dashboard) if logged in, otherwise home
  const destination = isAuthenticated ? '/study' : '/';

  return (
    <Link
      to={destination}
      className={clsx('group flex items-center gap-3 select-none', className)}
      aria-label="Thynkr Home"
    >
      <motion.div
        whileHover={animated ? { scale: 1.05 } : {}}
        whileTap={animated ? { scale: 0.95 } : {}}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#3b82f6] shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
      >
        {/* Inner glow/reflection */}
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon */}
        <Brain className="w-6 h-6 text-white relative z-10" strokeWidth={2.5} />

        {/* Pulse animation */}
        {animated && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-xl bg-white/20 blur-md -z-10"
          />
        )}
      </motion.div>

      {variant === 'full' && (
        <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#3b82f6] text-transparent bg-clip-text font-display">
          Thynkr
        </span>
      )}
    </Link>
  );
}
