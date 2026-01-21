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
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={toggleSelectAll}
          disabled={disabled || aiCompatibleFiles.length === 0}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {allAIFilesSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-500" />
          ) : someSelected ? (
            <div className="h-4 w-4 border-2 border-blue-500 rounded flex items-center justify-center">
              <div className="h-2 w-2 bg-blue-500 rounded-sm" />
            </div>
          ) : (
            <Square className="h-4 w-4" />
          )}
          Select All
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {selectedFileIds.size} of {aiCompatibleFiles.length} selected
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => isCompatible && toggleFile(file.id)}
                disabled={disabled || !isCompatible || isLoading}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b border-gray-100 dark:border-gray-700/50 ${
                  isCompatible
                    ? isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/30'
                }`}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {isCompatible ? (
                    isSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                {/* File Icon */}
                <div className="flex-shrink-0">{getFileIcon(file.fileType)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FileTypeBadge mimeType={file.fileType} className="text-[10px] px-1.5 py-0.5" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {isCompatible ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <Sparkles className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
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
