import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import SidebarGreeting from './SidebarGreeting';

interface SidebarHeaderProps {
  isExpanded: boolean;
  aiAssistMode?: boolean;
}

/**
 * SidebarHeader Component
 * Unified header section combining clock and personalized greeting
 * Displays time/date with dynamic user greeting in a cohesive layout
 * Enhanced with animated glows and gradient transitions
 */
const SidebarHeader = ({ isExpanded, aiAssistMode = false }: SidebarHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockGlowing, setIsClockGlowing] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Trigger glow animation on time change
      setIsClockGlowing(false);
      setTimeout(() => setIsClockGlowing(true), 50);
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

  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  if (!isExpanded) {
    // Collapsed state - show minimal clock icon with pulsating glow
    return (
      <div className="flex flex-col items-center gap-1.5 mt-4 relative rounded-lg py-3 bg-gradient-to-b from-white/5 to-transparent">
        <motion.div
          animate={{
            boxShadow: isClockGlowing
              ? [
                  '0 0 8px rgba(139, 92, 246, 0.3)',
                  '0 0 12px rgba(139, 92, 246, 0.5)',
                  '0 0 8px rgba(139, 92, 246, 0.3)',
                ]
              : '0 0 0px rgba(139, 92, 246, 0)',
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="rounded-full p-1.5"
        >
          <Clock className="w-4 h-4 text-gray-300 dark:text-gray-400" />
        </motion.div>
        <span className="font-semibold text-[10px] text-gray-300 dark:text-gray-400">
          {formatTime().split(' ')[0]}
        </span>
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
      className="overflow-hidden mt-4"
    >
      <div className="py-5 px-3 space-y-3 text-center group transition-all duration-300 hover:bg-white/[0.07] rounded-xl bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm relative">
        {/* Clock Section with Pulsating Glow */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-center gap-2.5 text-gray-300 dark:text-gray-400 group-hover:text-gray-200 dark:group-hover:text-gray-300 transition-colors duration-300">
            <motion.div
              animate={{
                boxShadow: isClockGlowing
                  ? [
                      '0 0 10px rgba(139, 92, 246, 0.4)',
                      '0 0 20px rgba(6, 182, 212, 0.6)',
                      '0 0 10px rgba(139, 92, 246, 0.4)',
                    ]
                  : '0 0 0px rgba(139, 92, 246, 0)',
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-full p-2 relative"
            >
              <Clock className="w-[18px] h-[18px] relative z-10" />
              {/* Gradient glow backdrop */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B5CF6] via-purple-500 to-[#06B6D4] opacity-20 blur-md"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <span className="font-semibold text-base tracking-tight">{formatTime()}</span>
          </div>
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500">{formatDate()}</div>
        </div>

        {/* Greeting Section with Time Period Key for Crossfade */}
        <AnimatePresence mode="wait">
          <SidebarGreeting key={timePeriod} timePeriod={timePeriod} />
        </AnimatePresence>

        {/* AI Assist Mode Indicator */}
        {aiAssistMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 mt-1 pt-2 border-t border-white/5"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 8px rgba(139, 92, 246, 0.6)',
                  '0 0 15px rgba(6, 182, 212, 0.8)',
                  '0 0 8px rgba(139, 92, 246, 0.6)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative"
            >
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4]" />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] blur-sm"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <span className="text-[10px] font-medium text-gray-300 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI Assist Active
            </span>
          </motion.div>
        )}
      </div>

      {/* Divider with Gradient */}
      <div className="relative mt-4">
        <div className="border-b border-white/10" />
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
};

export default SidebarHeader;
