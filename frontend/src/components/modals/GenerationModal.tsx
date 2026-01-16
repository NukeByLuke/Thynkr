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
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ 
                  y: [0, 15, 0],
                  x: [0, -10, 0],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/30 to-purple-500/30 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full blur-xl"
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

                {/* Animated Progress Bar */}
                <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: ['0%', '70%', '90%', '70%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
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
