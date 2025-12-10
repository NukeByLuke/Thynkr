/**
 * AuthTabs - Tab switcher for Sign In / Sign Up
 * Pill-style tabs with smooth transitions
 */

import { motion } from 'framer-motion';

interface AuthTabsProps {
  tabs: readonly string[];
  activeTab: number;
  onSwitch: (index: number) => void;
}

export function AuthTabs({ tabs, activeTab, onSwitch }: AuthTabsProps) {
  return (
    <div
      className="flex p-1 rounded-lg"
      style={{ backgroundColor: '#E5E7EB' }}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onSwitch(index)}
          className="relative flex-1 py-2.5 text-sm font-medium text-center rounded-md transition-all duration-200"
          style={{
            color: activeTab === index ? '#1F2937' : '#6B7280',
          }}
        >
          {activeTab === index && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: '#D1D5DB' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}

export default AuthTabs;
