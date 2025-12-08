import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

/**
 * SidebarGreeting Component
 * Displays personalized time-based greetings with smooth fade-in animation
 * Works in both light and dark mode with adaptive gradient styling
 */
const SidebarGreeting = () => {
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="pt-2"
    >
      <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]">
        {message}{' '}
        <span className="opacity-80" role="img" aria-label="greeting emoji">
          {emoji}
        </span>
      </p>
    </motion.div>
  );
};

export default SidebarGreeting;
