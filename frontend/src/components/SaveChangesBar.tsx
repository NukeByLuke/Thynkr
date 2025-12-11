/**
 * SaveChangesBar - Floating/sticky save bar that appears when form is dirty
 * Features Thynkr's signature blue/purple gradient
 */

import { Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaveChangesBarProps {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Callback when save button is clicked */
  onSave: () => void;
  /** Callback when discard button is clicked */
  onDiscard: () => void;
  /** Whether save operation is in progress */
  isSaving?: boolean;
  /** Optional save button text */
  saveText?: string;
}

export default function SaveChangesBar({
  isDirty,
  onSave,
  onDiscard,
  isSaving = false,
  saveText = 'Save Changes',
}: SaveChangesBarProps) {
  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 inline mr-1" />
                Discard
              </button>

              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/25"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : saveText}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
