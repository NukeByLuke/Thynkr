/**
 * GradientText Component
 * Aurora-themed gradient text for hero headings and emphasis.
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface GradientTextProps {
  children: ReactNode;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  className?: string;
}

/**
 * GradientText - Aurora gradient text effect
 * Uses bg-clip-text with the Aurora gradient for eye-catching headings.
 *
 * @example
 * <GradientText as="h1" className="text-5xl">Welcome to Thynkr</GradientText>
 */
export default function GradientText({
  children,
  as: Component = 'span',
  className,
}: GradientTextProps) {
  return (
    <Component
      className={clsx(
        'bg-clip-text text-transparent bg-gradient-aurora font-bold',
        className
      )}
    >
      {children}
    </Component>
  );
}
