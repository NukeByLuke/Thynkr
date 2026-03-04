import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File as FileIcon,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FileTypeBadge } from '@/lib/fileTypeUtils';

interface CourseFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  isAICompatible: boolean;
}

interface FileSelectionPaneProps {
  files: CourseFile[];
  selectedFileIds: Set<string>;
  onSelectionChange: (fileIds: Set<string>) => void;
  onFileOpen?: (fileId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// AI Compatible file types
const AI_COMPATIBLE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

function isAICompatible(fileType: string): boolean {
  return AI_COMPATIBLE_TYPES.includes(fileType) || fileType.startsWith('text/');
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="h-4 w-4 text-green-500" />;
  if (fileType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-500" />;
  if (fileType.startsWith('audio/')) return <Music className="h-4 w-4 text-violet-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  if (fileType === 'application/zip') return <Archive className="h-4 w-4 text-yellow-500" />;
  return <FileIcon className="h-4 w-4 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileSelectionPane({
  files,
  selectedFileIds,
  onSelectionChange,
  onFileOpen,
  isLoading = false,
  disabled = false,
}: FileSelectionPaneProps) {
  // Enrich files with AI compatibility
  const enrichedFiles = useMemo(
    () =>
      files.map((f) => ({
        ...f,
        isAICompatible: f.isAICompatible ?? isAICompatible(f.fileType),
      })),
    [files]
  );

  const aiCompatibleFiles = useMemo(
    () => enrichedFiles.filter((f) => f.isAICompatible),
    [enrichedFiles]
  );

  const allAIFilesSelected = useMemo(
    () => aiCompatibleFiles.length > 0 && aiCompatibleFiles.every((f) => selectedFileIds.has(f.id)),
    [aiCompatibleFiles, selectedFileIds]
  );

  const someSelected = selectedFileIds.size > 0 && !allAIFilesSelected;

  const toggleFile = (fileId: string) => {
    if (disabled) return;
    const next = new Set(selectedFileIds);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    onSelectionChange(next);
  };

  const toggleSelectAll = () => {
    if (disabled) return;
    if (allAIFilesSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(aiCompatibleFiles.map((f) => f.id)));
    }
  };

  const handleRowClick = (fileId: string, isCompatible: boolean) => {
    if (!isCompatible || disabled || isLoading) return;

    if (onFileOpen) {
      onFileOpen(fileId);
      return;
    }

    toggleFile(fileId);
  };

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <FileIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files in this course</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <motion.button
          onClick={toggleSelectAll}
          disabled={disabled || aiCompatibleFiles.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {allAIFilesSelected ? (
            <CheckSquare className="h-4 w-4 text-purple-500" />
          ) : someSelected ? (
            <div className="h-4 w-4 border-2 border-purple-500 rounded flex items-center justify-center">
              <div className="h-2 w-2 bg-purple-500 rounded-sm" />
            </div>
          ) : (
            <Square className="h-4 w-4" />
          )}
          Select All
        </motion.button>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
          {selectedFileIds.size} of {aiCompatibleFiles.length}
        </span>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {enrichedFiles.map((file, index) => {
            const isSelected = selectedFileIds.has(file.id);
            const isCompatible = file.isAICompatible;

            return (
              <motion.button
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  delay: index * 0.02,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
                onClick={() => handleRowClick(file.id, isCompatible)}
                disabled={disabled || !isCompatible || isLoading}
                whileHover={isCompatible && !disabled ? { x: 4, backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(148, 163, 184, 0.05)' } : {}}
                whileTap={isCompatible && !disabled ? { scale: 0.98 } : {}}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-100 dark:border-slate-700/50 ${
                  isCompatible
                    ? isSelected
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`flex-shrink-0 ${isCompatible && !disabled && !isLoading ? 'cursor-pointer' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isCompatible || disabled || isLoading) return;
                    toggleFile(file.id);
                  }}
                >
                  {isCompatible ? (
                    isSelected ? (
                      <motion.div
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <CheckSquare className="h-5 w-5 text-purple-500" />
                      </motion.div>
                    ) : (
                      <Square className="h-5 w-5 text-slate-400" />
                    )
                  ) : (
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {/* File Icon */}
                <div className="flex-shrink-0">{getFileIcon(file.fileType)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate transition-colors ${
                      isSelected
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <FileTypeBadge mimeType={file.fileType} className="text-[10px] px-2 py-0.5" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {isCompatible ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.02 + 0.1, type: 'spring', stiffness: 500, damping: 20 }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/30 dark:to-cyan-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50"
                    >
                      <Sparkles className="h-3 w-3" />
                    </motion.span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">N/A</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      )}
    </div>
  );
}
