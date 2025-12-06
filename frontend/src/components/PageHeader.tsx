import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-200 ease-in-out ${
        isScrolled ? 'shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : ''
      }`}
    >
      <div className="flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8 border-b border-slate-700/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && <div className="flex-shrink-0 text-brand-600 dark:text-brand-400">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-wide text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 truncate lg:whitespace-normal tracking-wide">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-3 ml-4 flex-shrink-0">{actions}</div>}
      </div>
    </motion.header>
  );
}
