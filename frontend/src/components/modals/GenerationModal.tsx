/**
 * GenerationModal Component
 * A sleek modal with glassmorphism backdrop for AI generation loading states
 * Features the Quantum Orbit animation from GenerationLoader
 */

import { motion, AnimatePresence } from 'framer-motion';
import GenerationLoader from '../ui/GenerationLoader';

interface GenerationModalProps {
  isOpen: boolean;
  type: 'summary' | 'notes' | 'flashcards' | 'quiz';
}

const typeStages = {
  summary: ['Analyzing content...', 'Extracting key points...', 'Synthesizing summary...', 'Finalizing...'],
  notes: ['Scanning document...', 'Identifying concepts...', 'Organizing notes...', 'Adding details...'],
  flashcards: ['Processing content...', 'Creating Q&A pairs...', 'Optimizing cards...', 'Finalizing deck...'],
  quiz: ['Analyzing material...', 'Generating questions...', 'Crafting answers...', 'Validating quiz...'],
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
            className="fixed inset-0 bg-slate-900/70 dark:bg-slate-900/70 backdrop-blur-xl z-50"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="relative bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-8 sm:p-12 max-w-md w-full mx-4 pointer-events-auto"
            >
              {/* Ambient glow effects */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-pink-500/20 dark:bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-500/20 dark:bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Quantum Loader Content */}
              <div className="relative z-10">
                <GenerationLoader 
                  isVisible={true} 
                  stages={typeStages[type]} 
                  size="lg" 
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

