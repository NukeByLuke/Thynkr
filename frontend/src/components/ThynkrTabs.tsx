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
      className={`w-full p-1 rounded-2xl flex relative border ${className} ${
        currentPath === '/register'
          ? 'border-brand-200/80 dark:border-cyan-400/30'
          : 'border-brand-100/80 dark:border-cyan-400/25'
      } bg-gradient-to-r from-brand-50/90 via-fuchsia-50/70 to-orange-50/80 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-violet-500/10`}
      role="tablist"
      aria-label="Authentication options"
    >
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        
        return (
          <Link
            key={tab.path}
            to={tab.path}
            role="tab"
            aria-selected={isActive}
            className="relative flex-1 py-2.5 sm:py-3 text-sm sm:text-base text-center rounded-xl z-10"
          >
            {/* Sliding Pill Background */}
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 via-fuchsia-500 to-orange-400 dark:from-cyan-500 dark:via-blue-500 dark:to-violet-500 shadow-[0_10px_24px_-14px_rgba(236,72,153,0.7)] dark:shadow-[0_10px_24px_-14px_rgba(34,211,238,0.75)]"
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
                  : 'text-slate-700 dark:text-slate-200 hover:text-brand-700 dark:hover:text-cyan-300'
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
