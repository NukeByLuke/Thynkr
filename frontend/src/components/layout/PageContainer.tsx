/**
 * PageContainer Component
 * Standard container layout for all pages ensuring consistent spacing,
 * max-width, and alignment across the app.
 * 
 * Layout rules:
 * - Max width: 1280px (max-w-6xl)
 * - Side padding: 2rem mobile, 4rem desktop
 * - Section spacing: 3rem minimum
 * - Soft shadows, rounded-2xl corners
 * 
 * Usage:
 *   <PageContainer>
 *     <PageContainer.Header>Title</PageContainer.Header>
 *     <PageContainer.Section>Content</PageContainer.Section>
 *   </PageContainer>
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Use full width without max-width constraint */
  fluid?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
  /** Add animation on mount */
  animate?: boolean;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  /** Render as a card with background/shadow/border */
  card?: boolean;
}

interface HeaderProps {
  children: ReactNode;
  className?: string;
  /** Subtitle text below the title */
  subtitle?: string;
  /** Actions to render on the right side */
  actions?: ReactNode;
}

/**
 * Main page container with consistent max-width and padding
 * Standard: max-w-6xl (1280px) mx-auto px-8 lg:px-16 py-8
 */
export default function PageContainer({
  children,
  className = '',
  fluid = false,
  noPadding = false,
  animate = true,
}: PageContainerProps) {
  const containerClasses = `
    ${fluid ? 'w-full' : 'max-w-6xl mx-auto'}
    ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-6'}
    ${className}
  `.trim();

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={containerClasses}
      >
        <div className="space-y-10">
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="space-y-10">
        {children}
      </div>
    </div>
  );
}

/**
 * Page header with title, optional subtitle, and actions
 */
function Header({ children, className = '', subtitle, actions }: HeaderProps) {
  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
          {children}
        </h1>
        {subtitle && (
          <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

/**
 * Section wrapper with optional card styling
 * Uses space-y-8 between sections for vertical rhythm
 */
function Section({ children, className = '', card = false }: SectionProps) {
  const sectionClasses = card
    ? `bg-white dark:bg-slate-800/70 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 p-6 ${className}`
    : className;

  return (
    <section className={sectionClasses}>
      {children}
    </section>
  );
}

/**
 * Card-based container for content groups
 * Standard: rounded-2xl with theme shadow and border
 */
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800/70 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/50 p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Grid layout for card-based content
 */
function Grid({ 
  children, 
  className = '',
  cols = 3 
}: { 
  children: ReactNode; 
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${colsClass} gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Attach subcomponents
PageContainer.Header = Header;
PageContainer.Section = Section;
PageContainer.Card = Card;
PageContainer.Grid = Grid;
