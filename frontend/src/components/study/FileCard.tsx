/**
 * FileCard Component
 * Premium glassmorphic card for displaying study files in a grid layout.
 */

import { useState } from 'react';
import { MoreVertical, Trash2, Edit2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { FileTypeBadge, getCleanFileType } from '@/lib/fileTypeUtils';

interface FileCardProps {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  isSelected?: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export default function FileCard({
  originalName,
  fileType,
  fileSize,
  status,
  createdAt,
  isSelected = false,
  onClick,
  onRename,
  onDelete,
}: FileCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Get file type info with proper PPTX detection
  const fileTypeInfo = getCleanFileType(fileType, originalName);
  const FileIcon = fileTypeInfo.icon;

  // Get icon color for glow effect
  const getIconGlowColor = () => {
    if (fileTypeInfo.label === 'PDF') return 'rgba(248, 113, 113, 0.15)';
    if (fileTypeInfo.label === 'Word Doc') return 'rgba(96, 165, 250, 0.15)';
    if (fileTypeInfo.label === 'PowerPoint') return 'rgba(251, 146, 60, 0.15)';
    return 'rgba(148, 163, 184, 0.15)';
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready</span>
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
            <Clock className="h-3 w-3 animate-spin" />
            <span>Processing</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-500/10 border border-slate-500/20 rounded-xl text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            <span>Uploaded</span>
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 will-change-transform ${
        isSelected
          ? 'bg-white dark:bg-zinc-900/80 backdrop-blur-md border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
          : 'bg-white dark:bg-zinc-900/60 backdrop-blur-md border-2 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-lg hover:shadow-xl'
      }`}
      onClick={onClick}
    >
      {/* Three Dots Menu */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-150 opacity-0 group-hover:opacity-100 active:scale-95 will-change-transform"
        >
          <MoreVertical className="h-4 w-4 text-slate-700 dark:text-white" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-10 right-0 w-40 bg-white dark:bg-zinc-900 backdrop-blur-xl border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-20"
              onMouseLeave={() => setShowMenu(false)}
            >
              {onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onRename();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150 active:scale-95"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Rename</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Content */}
      <div className="h-full flex flex-col items-center justify-between p-6">
        {/* File Icon with Glow */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Radial Glow Background */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${getIconGlowColor()} 0%, transparent 70%)`,
            }}
          />
          {/* Icon */}
          <div className="relative z-10">
            <FileIcon className="h-16 w-16" />
          </div>
        </div>

        {/* File Info Footer */}
        <div className="w-full space-y-2">
          {/* File Name */}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={originalName}>
            {originalName}
          </h3>

          {/* Metadata Row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileTypeBadge mimeType={fileType} fileName={originalName} className="text-[10px] px-2 py-0.5" />
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            <span className="text-slate-500 dark:text-slate-400">{formatFileSize(fileSize)}</span>
          </div>

          {/* Status Badge */}
          <div className="flex justify-start">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
