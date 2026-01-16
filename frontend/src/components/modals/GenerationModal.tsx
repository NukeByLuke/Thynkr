/**
 * GenerationModal Component
 * A sleek modal with glassmorphism backdrop for AI generation loading states
 * Features animated gradient progress bar and floating abstract shapes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface GenerationModalProps {
  isOpen: boolean;
  type: 'summary' | 'notes' | 'flashcards' | 'quiz';
}

const typeLabels = {
  summary: 'Summary',
  notes: 'Notes',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
};

export default function GenerationModal({ isOpen, type }: GenerationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Glassmorphism Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-50"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-white/20 dark:border-white/10 p-8 sm:p-12 max-w-md w-full mx-4 pointer-events-auto"
            >
              {/* Floating Abstract Shapes */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl"
              />

              {/* Content */}
              <div className="relative z-10 text-center space-y-6">
                {/* Icon */}
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>

                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Generating {typeLabels[type]}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI is analyzing your content...
                  </p>
                </div>

                {/* Simplified Indeterminate Progress Bar */}
                <div className="relative w-full h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                  {/* Moving gradient bar */}
                  <motion.div
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"
                    initial={{ x: '-100%' }}
                    animate={{ x: '400%' }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>

                {/* Pulsing Dots */}
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
