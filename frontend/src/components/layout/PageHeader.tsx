import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { throttle } from '@/utils/throttle';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = throttle(() => {
      const shouldBeScrolled = window.scrollY > 10;
      setIsScrolled((prev) => (prev !== shouldBeScrolled ? shouldBeScrolled : prev));
    }, 50);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl transition-all duration-300 ease-out ${
        isScrolled ? 'shadow-soft-md' : ''
      }`}
    >
      <div className="flex items-center justify-between py-3 px-6 lg:px-8 border-b border-gray-100/80 dark:border-slate-700/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-shrink-0 text-primary-500 dark:text-primary-400"
            >
              {icon}
            </motion.div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate lg:whitespace-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 ml-4 flex-shrink-0"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
