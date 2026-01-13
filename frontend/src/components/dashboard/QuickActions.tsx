/**
 * QuickActions Component
 * Grid of interactive cards for quick access to core features
 */

import { motion } from 'framer-motion';
import { UploadCloud, Gamepad2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  hoverGradient: string;
  action: () => void;
}

interface QuickActionsProps {
  onUploadClick?: () => void;
}

export default function QuickActions({ onUploadClick }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Upload Material',
      description: 'Add documents, PDFs, or audio files',
      icon: <UploadCloud className="h-8 w-8" />,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600',
      action: () => onUploadClick?.(),
    },
    {
      id: 'quiz',
      title: 'Start Quiz',
      description: 'Test your knowledge in the Arcade',
      icon: <Gamepad2 className="h-8 w-8" />,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600',
      action: () => navigate('/arcade'),
    },
    {
      id: 'courses',
      title: 'Browse Courses',
      description: 'Explore learning paths and materials',
      icon: <BookOpen className="h-8 w-8" />,
      gradient: 'from-amber-500 to-orange-500',
      hoverGradient: 'from-amber-600 to-orange-600',
      action: () => navigate('/courses'),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={action.action}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="
            relative overflow-hidden
            bg-white/70 dark:bg-slate-900/70
            backdrop-blur-xl
            border border-slate-200/50 dark:border-white/10
            rounded-2xl
            p-8
            text-left
            transition-all duration-300
            hover:shadow-2xl
            hover:border-white/20
            group
          "
        >
          {/* Gradient Background Overlay */}
          <div
            className={`
              absolute inset-0
              bg-gradient-to-br ${action.gradient}
              opacity-0 group-hover:opacity-10
              transition-opacity duration-300
            `}
          />

          {/* Hover Gradient Border Glow */}
          <div
            className={`
              absolute inset-0
              bg-gradient-to-br ${action.hoverGradient}
              opacity-0 group-hover:opacity-20
              blur-xl
              transition-opacity duration-300
            `}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon Container */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`
                inline-flex items-center justify-center
                w-16 h-16
                bg-gradient-to-br ${action.gradient}
                rounded-2xl
                mb-4
                shadow-lg
              `}
            >
              <div className="text-white">
                {action.icon}
              </div>
            </motion.div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {action.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {action.description}
            </p>

            {/* Arrow Indicator */}
            <motion.div
              initial={{ x: 0, opacity: 0 }}
              whileHover={{ x: 4, opacity: 1 }}
              className="absolute bottom-6 right-6 text-slate-400 dark:text-slate-500"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
