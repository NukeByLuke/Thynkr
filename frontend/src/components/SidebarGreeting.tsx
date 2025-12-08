import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface SidebarGreetingProps {
  timePeriod?: string;
}

/**
 * SidebarGreeting Component
 * Displays personalized time-based greetings with smooth crossfade animation
 * Works in both light and dark mode with adaptive gradient styling
 * Enhanced with gradient transitions when greeting changes
 */
const SidebarGreeting = ({ timePeriod: _timePeriod }: SidebarGreetingProps) => {
  const { user } = useAuth();

  const getGreeting = (): { message: string; emoji: string } => {
    const hour = new Date().getHours();
    const username = user?.firstName || user?.username || 'there';

    if (hour >= 5 && hour < 12) {
      return {
        message: `Rise and shine, ${username}`,
        emoji: '☀️',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        message: `Hope your studies are going great, ${username}`,
        emoji: '📘',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        message: `Good evening, ${username}`,
        emoji: '🌙',
      };
    } else {
      return {
        message: `Burning the midnight oil, ${username}?`,
        emoji: '💡',
      };
    }
  };

  const { message, emoji } = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pt-2 relative"
    >
      {/* Gradient background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/10 via-purple-500/5 to-[#06B6D4]/10 rounded-lg blur-xl"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] relative z-10">
        {message}{' '}
        <motion.span
          className="opacity-80 inline-block"
          role="img"
          aria-label="greeting emoji"
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.8,
            ease: 'easeInOut',
          }}
        >
          {emoji}
        </motion.span>
      </p>
    </motion.div>
  );
};

export default SidebarGreeting;
