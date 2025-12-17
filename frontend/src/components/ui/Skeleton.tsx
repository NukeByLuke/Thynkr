/**
 * Skeleton Loading Components
 * Performance-optimized shimmer loading with GPU acceleration for flicker-free transitions
 */

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Base shimmer skeleton element
 * Optimized gradient shimmer with GPU acceleration
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'rounded-lg relative overflow-hidden',
        'bg-slate-800',
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}

/**
 * Generic grid skeleton for courses, cards, and grid layouts
 * Maintains aspect ratios to prevent layout shifts
 */
export function GridSkeleton({ 
  count = 6,
  columns = { sm: 1, md: 2, lg: 3 },
  aspectRatio = 'video' // 'video' (16:9), 'square', 'portrait'
}: { 
  count?: number;
  columns?: { sm: number; md: number; lg: number };
  aspectRatio?: 'video' | 'square' | 'portrait';
}) {
  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]'
  }[aspectRatio];

  return (
    <div className={`grid grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          {/* Card image */}
          <Skeleton className={`w-full ${aspectClass} rounded-xl`} />
          {/* Card content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for course cards
 */
export function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-white/5 p-6 space-y-4">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-xl" />
      {/* Title */}
      <Skeleton className="h-6 w-3/4 rounded-md" />
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for study summaries
 */
export function SummarySkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-white/5 p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3 rounded-md" />
          <Skeleton className="h-4 w-1/4 rounded-md" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>
      {/* Key points */}
      <div className="space-y-2 pt-4">
        <Skeleton className="h-5 w-32 rounded-md" />
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic table skeleton for file lists and data tables
 * Maintains exact layout dimensions to prevent shifts
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-3">
      {/* Table header */}
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={clsx(
                'h-4',
                i === 0 ? 'w-12' : i === columns - 1 ? 'w-20' : 'flex-1'
              )} 
            />
          ))}
        </div>
      )}
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-white/5"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex}
              className={clsx(
                'h-5',
                colIndex === 0 ? 'w-10' : colIndex === columns - 1 ? 'w-16' : 'flex-1'
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for file list items
 */
export function FileItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-white/5">
      {/* File icon */}
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      {/* File info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
      {/* Actions */}
      <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

/**
 * Skeleton for file list
 */
export function FileListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FileItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for course grid (legacy - use GridSkeleton instead)
 */
export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard stats
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-white/5 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for text blocks
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4 rounded-md',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatar with name
 */
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center gap-3">
      <Skeleton className={clsx(sizes[size], 'rounded-full')} />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton for chat messages (AI Tutor)
 */
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={clsx('space-y-2 max-w-[70%]', isUser && 'items-end')}>
        <Skeleton className={clsx('h-4 rounded-md', isUser ? 'w-48' : 'w-64')} />
        <Skeleton className={clsx('h-4 rounded-md', isUser ? 'w-32' : 'w-56')} />
        {!isUser && <Skeleton className="h-4 w-40 rounded-md" />}
      </div>
    </div>
  );
}

/**
 * Skeleton for chat conversation
 */
export function ChatSkeleton({ messageCount = 4 }: { messageCount?: number }) {
  return (
    <div className="space-y-6 p-4">
      {Array.from({ length: messageCount }).map((_, i) => (
        <ChatMessageSkeleton key={i} isUser={i % 2 === 1} />
      ))}
    </div>
  );
}

export default Skeleton;
