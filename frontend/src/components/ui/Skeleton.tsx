/**
 * Skeleton Loading Components
 * Thea-inspired shimmer loading placeholders with gray gradient animation.
 */

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Base shimmer skeleton element
 * Gray gradient with smooth shimmer animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg',
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
        'dark:from-slate-700 dark:via-slate-600 dark:to-slate-700',
        'bg-[length:200%_100%]',
        className
      )}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

/**
 * Skeleton for course cards
 */
export function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 space-y-4">
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
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 space-y-6">
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
 * Skeleton for file list items
 */
export function FileItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
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
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
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
