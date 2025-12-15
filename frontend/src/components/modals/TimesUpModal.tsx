import { useEffect, useState } from 'react';
import { AlarmClock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimesUpModalProps {
  isOpen: boolean;
  onRedirect: () => void;
}

export default function TimesUpModal({ isOpen, onRedirect }: TimesUpModalProps) {
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    if (!isOpen) return;

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect after countdown completes
          setTimeout(() => {
            onRedirect();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onRedirect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                  <div className="relative bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                    <AlarmClock className="w-12 h-12 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Time's Up!
              </h2>

              {/* Body */}
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-lg">
                Your test is being submitted automatically.
              </p>

              {/* Loading Spinner & Countdown */}
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-6 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
