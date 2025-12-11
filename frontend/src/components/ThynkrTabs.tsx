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
      className={`w-full bg-slate-200 dark:bg-slate-700 p-1 rounded-full flex relative ${className}`}
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
            className="relative flex-1 py-2.5 text-sm text-center rounded-full z-10"
          >
            {/* Sliding Pill Background */}
            {isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-slate-800 dark:bg-slate-900 rounded-full"
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
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
