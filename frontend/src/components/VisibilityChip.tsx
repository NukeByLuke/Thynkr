import { Lock, Globe, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface VisibilityChipProps {
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  size?: 'sm' | 'md';
}

export default function VisibilityChip({ visibility, size = 'md' }: VisibilityChipProps) {
  const configs = {
    PUBLIC: {
      icon: Globe,
      label: 'Public',
      className:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    PRIVATE: {
      icon: Lock,
      label: 'Private',
      className:
        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    },
    DRAFT: {
      icon: FileText,
      label: 'Draft',
      className:
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
  };

  const config = configs[visibility];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        sizeClasses[size]
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
