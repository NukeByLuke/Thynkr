import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import SidebarGreeting from './SidebarGreeting';

interface SidebarHeaderProps {
  isExpanded: boolean;
}

/**
 * SidebarHeader Component
 * Unified header section combining clock and personalized greeting
 * Displays time/date with dynamic user greeting in a cohesive layout
 */
const SidebarHeader = ({ isExpanded }: SidebarHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(currentTime);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  if (!isExpanded) {
    // Collapsed state - show minimal clock icon
    return (
      <div className="flex flex-col items-center gap-1 text-xs text-gray-400 mt-4">
        <Clock className="w-4 h-4" />
        <span className="font-medium text-[10px]">{formatTime().split(' ')[0]}</span>
      </div>
    );
  }

  // Expanded state - show full header with clock and greeting
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="py-4 space-y-2 text-center group transition-all duration-300 hover:bg-white/5 rounded-lg px-2">
        {/* Clock Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTime()}</span>
          </div>
          <div className="text-xs text-gray-500">{formatDate()}</div>
        </div>

        {/* Greeting Section */}
        <SidebarGreeting />
      </div>

      {/* Divider */}
      <div className="border-b border-white/10 mt-4" />
    </motion.div>
  );
};

export default SidebarHeader;
