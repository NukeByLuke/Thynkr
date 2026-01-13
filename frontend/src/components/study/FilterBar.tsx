/**
 * FilterBar Component
 * Provides filtering and sorting controls for the study file grid
 */

import { useState } from 'react';
import { FileText, File, Music, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FileFilter = 'all' | 'pdf' | 'document' | 'audio';
export type SortOrder = 'newest' | 'oldest';

interface FilterBarProps {
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

export default function FilterBar({
  activeFilter,
  onFilterChange,
  sortOrder,
  onSortChange,
}: FilterBarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);

  const filters: Array<{ id: FileFilter; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All Files', icon: null },
    { id: 'pdf', label: 'PDFs', icon: <FileText className="h-4 w-4" /> },
    { id: 'document', label: 'Documents', icon: <File className="h-4 w-4" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="h-4 w-4" /> },
  ];

  const sortOptions: Array<{ id: SortOrder; label: string }> = [
    { id: 'newest', label: 'Newest First' },
    { id: 'oldest', label: 'Oldest First' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200 flex items-center gap-2
              ${
                activeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="
            px-4 py-2 rounded-lg text-sm font-medium
            bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl
            border border-slate-200/50 dark:border-white/10
            text-slate-700 dark:text-slate-300
            hover:bg-white/90 dark:hover:bg-slate-800/90
            transition-all duration-200
            flex items-center gap-2
          "
        >
          <span>
            {sortOptions.find((opt) => opt.id === sortOrder)?.label || 'Sort by'}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isSortOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isSortOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsSortOpen(false)}
              />

              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="
                  absolute right-0 mt-2 w-48 z-20
                  bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
                  border border-slate-200/50 dark:border-white/10
                  rounded-lg shadow-xl
                  overflow-hidden
                "
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSortChange(option.id);
                      setIsSortOpen(false);
                    }}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      transition-colors duration-150
                      ${
                        sortOrder === option.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
