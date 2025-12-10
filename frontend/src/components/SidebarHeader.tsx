import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import SidebarGreeting from './SidebarGreeting';

interface SidebarHeaderProps {
  isExpanded: boolean;
  aiAssistMode?: boolean;
}

/**
 * SidebarHeader Component
 * Simplified header with greeting and optional time display
 * Clean minimal aesthetic with muted tones
 */
const SidebarHeader = ({ isExpanded, aiAssistMode = false }: SidebarHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Memoize time period to detect greeting changes
  const timePeriod = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }, [currentTime]);

  const formatTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(currentTime);
  };

  if (!isExpanded) {
    // Collapsed state - show minimal time
    return (
      <div className="flex flex-col items-center py-4">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
          {formatTime()}
        </span>
      </div>
    );
  }

  // Expanded state - show greeting with subtle time
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-4"
    >
      {/* Greeting */}
      <AnimatePresence mode="wait">
        <SidebarGreeting key={timePeriod} timePeriod={timePeriod} />
      </AnimatePresence>

      {/* Subtle time display */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {formatTime()}
      </p>

      {/* AI Assist Mode Indicator */}
      {aiAssistMode && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            AI Assist Active
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default SidebarHeader;
