/**
 * DashboardHero Component
 * Banner-style hero section with user greeting, daily streak, and XP progress
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

interface DashboardHeroProps {
  userName: string;
  currentStreak: number;
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
}

export default function DashboardHero({
  userName,
  currentStreak,
  currentXP,
  nextLevelXP,
  currentLevel,
}: DashboardHeroProps) {
  // Calculate time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Calculate XP progress percentage
  const xpProgress = (currentXP / nextLevelXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        relative overflow-hidden
        bg-gradient-to-r from-indigo-900/50 to-purple-900/50
        backdrop-blur-xl
        border border-white/10
        rounded-3xl
        p-8 md:p-10
        shadow-xl
      "
    >
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        
        {/* Left Section - Greeting */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            {greeting}, {userName}!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-300 text-lg"
          >
            Ready to continue your learning journey?
          </motion.p>
        </div>

        {/* Right Section - Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-8">
          
          {/* Daily Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full" />
              
              {/* Fire Icon with Animation */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="relative"
              >
                <Flame className="h-12 w-12 text-orange-500" fill="currentColor" />
              </motion.div>
            </div>
            
            <div>
              <div className="text-3xl font-bold text-white">
                {currentStreak}
              </div>
              <div className="text-sm text-slate-300">
                Day Streak
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-16 bg-white/20" />

          {/* XP Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-4 min-w-[200px]"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full" />
              
              {/* Level Badge */}
              <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" fill="currentColor" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xl font-bold text-white">
                  Level {currentLevel}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                />
                
                {/* Shimmer Effect */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>
              
              <div className="text-xs text-slate-400 mt-1">
                {currentXP} / {nextLevelXP} XP
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
