import { motion } from 'framer-motion';

interface LoadingProgressProps {
  message?: string;
  stage?: string;
}

export default function LoadingProgress({
  message = 'Processing...',
  stage,
}: LoadingProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Animated gradient bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500 rounded-full"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '50%' }}
          />
        </div>
      </div>

      {/* Spinning icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 mb-4"
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#spinGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 40"
          />
          <defs>
            <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#22D3EE" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-700 dark:text-slate-300 font-medium mb-2"
      >
        {message}
      </motion.p>

      {/* Stage */}
      {stage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 dark:text-slate-400"
        >
          {stage}
        </motion.p>
      )}

      {/* Pulsing dots */}
      <div className="flex items-center gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-brand-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
