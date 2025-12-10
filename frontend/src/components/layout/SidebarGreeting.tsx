import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarGreetingProps {
  timePeriod?: string;
}

/**
 * SidebarGreeting Component
 * Displays personalized time-based greetings with subtle animation
 * Muted gray text for calm minimal aesthetic
 */
const SidebarGreeting = ({ timePeriod: _timePeriod }: SidebarGreetingProps) => {
  const { user } = useAuth();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const username = user?.firstName || user?.username || 'there';

    if (hour >= 5 && hour < 12) {
      return `Good morning, ${username}`;
    } else if (hour >= 12 && hour < 17) {
      return `Good afternoon, ${username}`;
    } else if (hour >= 17 && hour < 22) {
      return `Good evening, ${username}`;
    } else {
      return `Good night, ${username}`;
    }
  };

  const message = getGreeting();

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="text-sm text-gray-500 dark:text-gray-400 font-normal"
    >
      {message}
    </motion.p>
  );
};

export default SidebarGreeting;
