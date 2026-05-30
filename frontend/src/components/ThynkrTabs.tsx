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
      className={`w-full p-1 rounded-[2px] flex relative border-2 ${className} ${
        currentPath === '/register'
          ? 'border-slate-500 dark:border-slate-500'
          : 'border-slate-400 dark:border-slate-600'
      } bg-slate-100 dark:bg-slate-800`}
      role="tablist"
      aria-label="Authentication options"
    >
      <span className="pointer-events-none absolute left-1/2 top-1 bottom-1 -translate-x-1/2 border-l-2 border-slate-300 dark:border-slate-600" />
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        
        return (
          <Link
            key={tab.path}
            to={tab.path}
            role="tab"
            aria-selected={isActive}
            className="relative flex-1 py-2.5 sm:py-3 text-sm sm:text-base text-center rounded-[2px] z-10"
          >
            {/* Sliding Pill Background */}
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-[2px] bg-blue-700 dark:bg-blue-500 border-2 border-blue-900 dark:border-blue-300"
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
                  : 'text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white'
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
