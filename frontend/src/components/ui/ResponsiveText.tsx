/**
 * ResponsiveText Component
 * Automatically adjusts text size based on content length
 */

import { clsx } from 'clsx';

interface ResponsiveTextProps {
  content: string;
  className?: string;
}

export default function ResponsiveText({ content, className }: ResponsiveTextProps) {
  // Determine text size based on character count
  const getTextSize = () => {
    const length = content.length;
    
    if (length < 20) {
      return 'text-lg';
    } else if (length >= 20 && length < 50) {
      return 'text-md';
    } else {
      return 'text-sm line-clamp-3';
    }
  };

  return (
    <span className={clsx(getTextSize(), className)}>
      {content}
    </span>
  );
}
