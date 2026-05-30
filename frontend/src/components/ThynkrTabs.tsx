/**
 * ThynkrTabs - Animated tab switcher for Login/Signup
 * Features a morphing background that slides between tabs
 * Uses Framer Motion layoutId="tab-pill" for smooth animation
 */

import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

interface Tab {
  label: string;
  path: string;
}

const tabs: Tab[] = [
  { label: 'Sign in', path: '/login' },
  { label: 'Sign up', path: '/register' },
];

interface ThynkrTabsProps {
  className?: string;
}

export default function ThynkrTabs({ className = '' }: ThynkrTabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div 
      className={`w-full p-0.5 rounded-[2px] flex relative border-2 ${className} ${
        currentPath === '/register'
          ? 'border-orange-200 dark:border-cyan-500/30'
          : 'border-fuchsia-200 dark:border-cyan-400/25'
      } bg-gradient-to-r from-fuchsia-50 via-white to-orange-50 dark:from-cyan-500/10 dark:via-slate-900 dark:to-violet-500/10`}
      role="tablist"
      aria-label="Authentication options"
    >
      <span className="pointer-events-none absolute left-1/2 top-1 bottom-1 -translate-x-1/2 border-l-2 border-fuchsia-200 dark:border-cyan-500/25" />
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        
        return (
          <Link
            key={tab.path}
            to={tab.path}
            role="tab"
            aria-selected={isActive}
            className="relative flex-1 py-2 sm:py-2.5 text-sm sm:text-base text-center rounded-[2px] z-10"
          >
            {/* Sliding Pill Background */}
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-[2px] bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 dark:from-cyan-500 dark:via-blue-500 dark:to-violet-500 border-2 border-fuchsia-700 dark:border-cyan-300"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            
            {/* Tab Label */}
            <span 
              className={`relative z-10 font-medium transition-colors duration-200 ${
                isActive 
                  ? 'text-white'
                  : 'text-slate-700 dark:text-slate-200 hover:text-fuchsia-700 dark:hover:text-cyan-300'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
