/**
 * FileContextSelector Component
 * Reusable file picker with search and custom styling
 * Coherent with Thynkr minimalist design system
 */

import { useState, useMemo } from 'react';
import { Search, FileText, FileDigit, Check } from 'lucide-react';
import { clsx } from 'clsx';

// =============================================================================
// Types
// =============================================================================

export interface FileItem {
  id: string;
  name: string;
  type: string;
  date?: string;
}

interface FileContextSelectorProps {
  files: FileItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Get file icon and color based on file type
 */
function getFileIconAndColor(type: string): {
  icon: typeof FileText;
  color: string;
} {
  const lowerType = type.toLowerCase();
  
  // Spreadsheet types
  if (lowerType.includes('spreadsheet') || lowerType.includes('excel') || lowerType.includes('csv')) {
    return { icon: FileDigit, color: 'text-emerald-500' };
  }
  
  // Word documents
  if (lowerType.includes('word') || lowerType.includes('document')) {
    return { icon: FileText, color: 'text-blue-500' };
  }
  
  // PDFs
  if (lowerType.includes('pdf')) {
    return { icon: FileText, color: 'text-red-500' };
  }
  
  // Text files
  if (lowerType.includes('text') || lowerType.includes('plain')) {
    return { icon: FileText, color: 'text-slate-500' };
  }
  
  // Default
  return { icon: FileText, color: 'text-slate-400' };
}

/**
 * Format date string for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// =============================================================================
// Custom Checkbox Component
// =============================================================================

interface CustomCheckboxProps {
  checked: boolean;
}

function CustomCheckbox({ checked }: CustomCheckboxProps) {
  return (
    <div
      className={clsx(
        'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200',
        checked
          ? 'bg-cyan-500 text-white'
          : 'ring-2 ring-slate-300 dark:ring-slate-600'
      )}
    >
      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
    </div>
  );
}

// =============================================================================
// File Item Component
// =============================================================================

interface FileItemProps {
  file: FileItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function FileItemRow({ file, isSelected, onToggle }: FileItemProps) {
  const { icon: Icon, color } = getFileIconAndColor(file.type);
  const formattedDate = formatDate(file.date);

  return (
    <button
      onClick={() => onToggle(file.id)}
      className={clsx(
        'w-full flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
        'hover:bg-slate-50 dark:hover:bg-slate-800',
        isSelected
          ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          : 'border-transparent'
      )}
    >
      {/* Icon */}
      <Icon className={clsx('w-5 h-5 flex-shrink-0', color)} />

      {/* Text Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {file.name}
        </p>
        {formattedDate && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formattedDate}
          </p>
        )}
      </div>

      {/* Custom Checkbox */}
      <CustomCheckbox checked={isSelected} />
    </button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function FileContextSelector({
  files,
  selectedIds,
  onToggle,
}: FileContextSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter files based on search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    
    const query = searchQuery.toLowerCase();
    return files.filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  return (
    <div className="flex flex-col">
      {/* Search Bar - Sticky */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full pl-10 pr-4 py-2.5 rounded-xl',
              'bg-slate-50 dark:bg-slate-800',
              'border border-slate-200 dark:border-slate-700',
              'text-sm text-slate-900 dark:text-white',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-shadow'
            )}
          />
        </div>
      </div>

      {/* File List - Scrollable */}
      <div className="overflow-y-auto max-h-[400px] space-y-1.5 pr-1">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <FileItemRow
              key={file.id}
              file={file}
              isSelected={selectedIds.includes(file.id)}
              onToggle={onToggle}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {searchQuery ? 'No files match your search' : 'No files available'}
            </p>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {selectedIds.length} file{selectedIds.length === 1 ? '' : 's'} selected
          </p>
        </div>
      )}
    </div>
  );
}
