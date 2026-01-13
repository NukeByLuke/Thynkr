/**
 * ActionMenu Component
 * Mobile-friendly action menu with larger touch targets
 * Can be used as dropdown (desktop) or bottom sheet (mobile)
 */

import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, X } from 'lucide-react';
import { clsx } from 'clsx';
import IconButton from './IconButton';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
  'aria-label'?: string;
}

/**
 * ActionMenu - Responsive action menu
 * - Mobile (<768px): Bottom drawer with large touch targets
 * - Desktop (≥768px): Dropdown menu next to trigger
 */
export default function ActionMenu({
  items,
  trigger,
  align = 'right',
  'aria-label': ariaLabel = 'Actions',
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      {trigger ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="touch-manipulation"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {trigger}
        </button>
      ) : (
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <MoreVertical className="w-5 h-5" />
        </IconButton>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile: Bottom Sheet Drawer */}
            <motion.div
              className="md:hidden fixed inset-0 z-50 flex items-end"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />

              {/* Drawer */}
              <motion.div
                className="relative w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-xl border-t border-slate-200 dark:border-slate-800 pb-safe"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                role="menu"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {ariaLabel}
                  </h3>
                  <IconButton
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="sm"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>

                {/* Menu Items - Large Touch Targets */}
                <div className="px-4 py-3 space-y-1">
                  {items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemClick(item)}
                      disabled={item.disabled}
                      className={clsx(
                        'w-full flex items-center gap-4 px-4 py-4 rounded-xl',
                        'text-left font-medium transition-colors',
                        'touch-manipulation active:scale-[0.98]',
                        'min-h-[56px]', // Extra large for mobile
                        item.disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : item.variant === 'danger'
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 active:bg-red-100 dark:active:bg-red-950/50'
                          : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700'
                      )}
                      role="menuitem"
                    >
                      {item.icon && (
                        <span className="flex-shrink-0 text-current">
                          {item.icon}
                        </span>
                      )}
                      <span className="text-base">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Desktop: Dropdown Menu */}
            <motion.div
              className={clsx(
                'hidden md:block absolute z-50 mt-2 min-w-[200px]',
                'bg-white dark:bg-slate-800 rounded-xl shadow-xl',
                'border border-slate-200 dark:border-slate-700',
                'py-2',
                align === 'right' ? 'right-0' : 'left-0'
              )}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              role="menu"
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'text-left text-sm font-medium transition-colors',
                    'min-h-[40px]',
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : item.variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className="flex-shrink-0 text-current w-5 h-5">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
