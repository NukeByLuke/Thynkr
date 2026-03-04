import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'courses' | 'study' | 'files' | 'progress';
}

const illustrations = {
  courses: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Books and learning illustration */}
      <rect x="60" y="80" width="40" height="60" rx="4" fill="url(#grad1)" opacity="0.9" />
      <rect x="75" y="70" width="40" height="60" rx="4" fill="url(#grad2)" opacity="0.9" />
      <rect x="90" y="60" width="40" height="60" rx="4" fill="url(#grad3)" opacity="0.9" />
      <circle cx="100" cy="40" r="15" fill="#F59E0B" opacity="0.7" />
      <path d="M100 30 L105 40 L95 40 Z" fill="white" />
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C026D3" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
    </svg>
  ),
  study: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Brain/lightbulb with document */}
      <rect x="70" y="100" width="60" height="80" rx="4" fill="url(#studyGrad1)" opacity="0.9" />
      <rect x="78" y="108" width="44" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="78" y="118" width="44" height="2" rx="1" fill="white" opacity="0.6" />
      <rect x="78" y="128" width="32" height="2" rx="1" fill="white" opacity="0.6" />
      <circle cx="100" cy="60" r="25" fill="url(#studyGrad2)" />
      <path
        d="M95 50 Q95 45 100 45 Q105 45 105 50"
        stroke="#F59E0B"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="92" cy="75" r="2" fill="#F59E0B" />
      <circle cx="108" cy="75" r="2" fill="#F59E0B" />
      <defs>
        <linearGradient id="studyGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
        <linearGradient id="studyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C026D3" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
    </svg>
  ),
  files: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Folder with documents */}
      <path d="M60 80 L60 150 L140 150 L140 95 L120 80 Z" fill="url(#fileGrad1)" opacity="0.9" />
      <path
        d="M60 80 L90 80 L100 70 L120 70 L120 80 L140 80 L140 95 L60 95 Z"
        fill="url(#fileGrad2)"
      />
      <rect x="75" y="105" width="50" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="75" y="115" width="50" height="2" rx="1" fill="white" opacity="0.5" />
      <rect x="75" y="125" width="35" height="2" rx="1" fill="white" opacity="0.5" />
      <defs>
        <linearGradient id="fileGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C026D3" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="fileGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Chart/graph illustration */}
      <rect x="50" y="120" width="25" height="40" rx="4" fill="url(#progGrad1)" opacity="0.9" />
      <rect x="82" y="100" width="25" height="60" rx="4" fill="url(#progGrad2)" opacity="0.9" />
      <rect x="114" y="80" width="25" height="80" rx="4" fill="url(#progGrad3)" opacity="0.9" />
      <circle cx="130" cy="60" r="8" fill="#F59E0B" />
      <path
        d="M125 60 L128 63 L135 56"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="progGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
        <linearGradient id="progGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C026D3" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="progGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
    </svg>
  ),
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-10 max-w-3xl">
        {/* Illustration */}
        {illustration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0"
          >
            {illustrations[illustration]}
          </motion.div>
        )}

        {/* Content */}
        <div className="flex-1">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-4 sm:mb-5"
          >
            <div className="text-primary-500 dark:text-primary-400">{icon}</div>
          </motion.div>

          {/* Text */}
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-lg sm:text-xl font-medium text-slate-800 dark:text-slate-100 mb-2"
          >
            {title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-5 sm:mb-6 max-w-sm mx-auto"
          >
            {description}
          </motion.p>

          {/* Action Button */}
          {actionLabel && onAction && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button onClick={onAction} size="md">
                {actionLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
