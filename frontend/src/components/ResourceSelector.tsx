/**
 * ResourceSelector Component
 * Polymorphic resource picker supporting both Files and Courses
 * Follows Open/Closed Principle: open for extension, closed for modification
 */

import { useState, useMemo } from 'react';
import { Search, Check, FileText, File, Image, Video, Music, Archive, BookOpen, Clock, FolderOpen } from 'lucide-react';
import { UploadedFile } from '../types/global';
import { clsx } from 'clsx';

// =============================================================================
// Types
// =============================================================================

type ResourceType = 'FILE' | 'COURSE';

interface Course {
  id: string;
  title: string;
  description?: string;
  fileCount: number;
  lastStudied?: string;
  createdAt: string;
}

interface ResourceSelectorProps {
  type: ResourceType;
  files?: UploadedFile[];
  courses?: Course[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
  className?: string;
}

// =============================================================================
// File Type Utilities
// =============================================================================

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-green-500" />;
  if (fileType.startsWith('video/')) return <Video className="h-5 w-5 text-blue-500" />;
  if (fileType.startsWith('audio/')) return <Music className="h-5 w-5 text-purple-500" />;
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes('document') || fileType.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
  if (fileType === 'application/zip' || fileType.includes('archive')) return <Archive className="h-5 w-5 text-yellow-500" />;
  if (fileType === 'text/plain') return <File className="h-5 w-5 text-gray-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  
  return date.toLocaleDateString();
};

// =============================================================================
// File Item Component
// =============================================================================

interface FileItemProps {
  file: UploadedFile;
  isSelected: boolean;
  onToggle: () => void;
}

function FileItem({ file, isSelected, onToggle }: FileItemProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 text-left',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {getFileIcon(file.fileType || 'text/plain')}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {file.originalName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(file.createdAt)}
        </p>
      </div>

      {/* Checkbox */}
      <div
        className={clsx(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150',
          isSelected
            ? 'bg-blue-500 border-blue-500'
            : 'border-slate-300 dark:border-slate-600'
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

// =============================================================================
// Course Item Component
// =============================================================================

interface CourseItemProps {
  course: Course;
  isSelected: boolean;
  onToggle: () => void;
}

function CourseItem({ course, isSelected, onToggle }: CourseItemProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'w-full flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 text-left rounded-lg',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <BookOpen className="h-6 w-6 text-blue-500" />
      </div>

      {/* Course Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {course.title}
        </p>
        
        {course.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            {course.fileCount} {course.fileCount === 1 ? 'file' : 'files'}
          </span>
          
          {course.lastStudied && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Studied {formatDate(course.lastStudied)}
            </span>
          )}
        </div>
      </div>

      {/* Checkbox */}
      <div
        className={clsx(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150',
          isSelected
            ? 'bg-blue-500 border-blue-500'
            : 'border-slate-300 dark:border-slate-600'
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

// =============================================================================
// Main ResourceSelector Component
// =============================================================================

export default function ResourceSelector({
  type,
  files = [],
  courses = [],
  selectedIds,
  onToggle,
  multiSelect = true,
  className = '',
}: ResourceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Polymorphic filtering based on resource type
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (type === 'FILE') {
      if (!query.trim()) return files;
      return files.filter(file =>
        file.originalName.toLowerCase().includes(query) ||
        file.fileName.toLowerCase().includes(query)
      );
    } else {
      if (!query.trim()) return courses;
      return courses.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query)
      );
    }
  }, [type, files, courses, searchQuery]);

  // Handle selection
  const handleToggle = (id: string) => {
    if (!multiSelect) {
      onToggle(id);
    } else {
      onToggle(id);
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  // Empty state based on type
  const emptyStateConfig = {
    FILE: {
      icon: File,
      noItemsMessage: 'No files uploaded yet',
      noSearchMessage: 'No files match your search',
      searchPlaceholder: 'Search your files...',
    },
    COURSE: {
      icon: BookOpen,
      noItemsMessage: 'No courses created yet',
      noSearchMessage: 'No courses match your search',
      searchPlaceholder: 'Search your courses...',
    },
  };

  const config = emptyStateConfig[type];
  const EmptyIcon = config.icon;

  return (
    <div className={clsx('border border-slate-200 dark:border-slate-800 rounded-xl', className)}>
      {/* Search Bar - Sticky at top */}
      <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 rounded-t-xl z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Resource List */}
      <div className="h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <EmptyIcon className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">
              {searchQuery.trim() ? config.noSearchMessage : config.noItemsMessage}
            </p>
          </div>
        ) : (
          <div className={clsx(type === 'FILE' ? 'divide-y divide-slate-200 dark:divide-slate-800' : 'p-3 space-y-2')}>
            {type === 'FILE' ? (
              (filteredItems as UploadedFile[]).map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  isSelected={isSelected(file.id)}
                  onToggle={() => handleToggle(file.id)}
                />
              ))
            ) : (
              (filteredItems as Course[]).map((course) => (
                <CourseItem
                  key={course.id}
                  course={course}
                  isSelected={isSelected(course.id)}
                  onToggle={() => handleToggle(course.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export types for external use
export type { ResourceType, Course };
