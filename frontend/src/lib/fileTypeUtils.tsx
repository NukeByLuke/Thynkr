/**
 * File Type Utilities
 * Centralized file type mapping and badge rendering
 */

import { FileText, File, Image, Video, Music, Archive, Link } from 'lucide-react';

export interface FileTypeInfo {
  label: string;
  color: string;
  icon: typeof FileText;
}

/**
 * Maps MIME types and file extensions to clean, human-readable labels with styling
 * Enhanced to properly detect PPTX vs DOCX files
 */
export function getCleanFileType(mimeType: string, fileName?: string): FileTypeInfo {
  const type = mimeType.toLowerCase();
  const extension = fileName?.toLowerCase().split('.').pop() || '';
  
  // === PRESENTATIONS (PowerPoint) - HIGH PRIORITY CHECK ===
  // Check extension first to avoid confusion with generic "document" MIME types
  if (
    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    type === 'application/vnd.openxmlformats-officedocument.presentationml.slideshow' ||
    type === 'application/vnd.ms-powerpoint' ||
    type.includes('presentation') ||
    type.includes('powerpoint') ||
    type.includes('presentationml') ||
    ['ppt', 'pptx', 'pps', 'ppsx'].includes(extension) ||
    type.includes('.ppt')
  ) {
    return {
      label: 'PowerPoint',
      color: 'text-orange-600 dark:text-orange-400 bg-orange-600/10 border-orange-600/20',
      icon: File,
    };
  }
  
  // === DOCUMENTS - PDF ===
  if (type.includes('pdf') || extension === 'pdf') {
    return {
      label: 'PDF',
      color: 'text-red-600 dark:text-red-400 bg-red-600/10 border-red-600/20',
      icon: FileText,
    };
  }
  
  // === DOCUMENTS - Word ===
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword' ||
    type.includes('word') ||
    type.includes('wordprocessingml') ||
    ['doc', 'docx'].includes(extension) ||
    type.includes('.doc')
  ) {
    return {
      label: 'Word Doc',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-600/10 border-blue-600/20',
      icon: FileText,
    };
  }
  
  // === DOCUMENTS - Excel ===
  if (
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.ms-excel' ||
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    type.includes('sheet') ||
    ['xls', 'xlsx'].includes(extension) ||
    type.includes('.xls')
  ) {
    return {
      label: 'Excel',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 border-emerald-600/20',
      icon: FileText,
    };
  }
  
  // === DOCUMENTS - Text ===
  if (type.includes('text/plain') || extension === 'txt') {
    return {
      label: 'Text File',
      color: 'text-slate-600 dark:text-slate-400 bg-slate-600/10 border-slate-600/20',
      icon: FileText,
    };
  }
  
  // === MEDIA - Images ===
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return {
      label: 'Image',
      color: 'text-green-600 dark:text-green-400 bg-green-600/10 border-green-600/20',
      icon: Image,
    };
  }
  
  // === MEDIA - Video/YouTube ===
  if (
    type.startsWith('video/') || 
    type.includes('youtube') || 
    type.includes('youtu.be') || 
    type === 'video/youtube' ||
    ['mp4', 'webm', 'mov', 'avi'].includes(extension)
  ) {
    const label = type.includes('youtube') || type.includes('youtu.be') ? 'YouTube' : 'Video';
    return {
      label,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-600/10 border-purple-600/20',
      icon: Video,
    };
  }
  
  // === MEDIA - Audio ===
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
    return {
      label: 'Audio',
      color: 'text-violet-600 dark:text-violet-400 bg-violet-600/10 border-violet-600/20',
      icon: Music,
    };
  }
  
  // === ARCHIVES ===
  if (
    type.includes('zip') || 
    type.includes('archive') || 
    type.includes('rar') || 
    type.includes('7z') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)
  ) {
    return {
      label: 'Archive',
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-600/10 border-yellow-600/20',
      icon: Archive,
    };
  }
  
  // === LINKS ===
  if (type.includes('link') || type.includes('url')) {
    return {
      label: 'Link',
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-600/10 border-cyan-600/20',
      icon: Link,
    };
  }
  
  // === DEFAULT ===
  return {
    label: 'File',
    color: 'text-slate-600 dark:text-slate-400 bg-slate-600/10 border-slate-600/20',
    icon: File,
  };
}

/**
 * File Type Badge Component - Semi-Rounded Design
 * Renders a clean, high-contrast badge with rounded-xl styling
 */
export function FileTypeBadge({ 
  mimeType, 
  fileName,
  className = '' 
}: { 
  mimeType: string; 
  fileName?: string;
  className?: string;
}) {
  const { label, color } = getCleanFileType(mimeType, fileName);
  
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-medium border ${color} ${className}`}>
      {label}
    </span>
  );
}

/**
 * Get file icon with color for display (legacy support)
 */
export function getFileIcon(fileType: string, fileName?: string) {
  const { icon: Icon, color } = getCleanFileType(fileType, fileName);
  return { icon: Icon, color: color.split(' ')[0] };
}
