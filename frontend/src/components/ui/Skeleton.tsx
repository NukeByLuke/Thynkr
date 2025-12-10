/**
 * Skeleton Loading Components
 * Shimmer loading placeholders for various content types
 */

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Base shimmer skeleton element
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer',
        className
      )}
    />
  );
}

/**
 * Skeleton for course cards
 */
export function CourseCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6 space-y-4">
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-2xl" />
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      {/* Footer */}
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for study summaries
 */
export function SummarySkeleton() {
  return (
    <div className="rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Key points */}
      <div className="space-y-2 pt-4">
        <Skeleton className="h-5 w-32" />
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
 * Skeleton for file list items
 */
export function FileItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-700/30">
      {/* File icon */}
      <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
      {/* File info */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
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
 * Skeleton for course grid
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
    <div className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export default Skeleton;
