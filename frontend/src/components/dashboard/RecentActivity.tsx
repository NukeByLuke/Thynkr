/**
 * RecentActivity Component
 * Displays recent study sessions with quick resume actions
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Gamepad2, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface StudySession {
  id: string;
  userId: string;
  activityType: 'QUIZ' | 'READ' | 'CHAT' | 'FLASHCARDS' | 'STUDY_PACK';
  fileId?: string;
  fileName?: string;
  courseId?: string;
  courseName?: string;
  duration: number;
  xpEarned: number;
  createdAt: string;
}

interface ActivityItemProps {
  session: StudySession;
  index: number;
  onResume: () => void;
}

function ActivityItem({ session, index, onResume }: ActivityItemProps) {
  // Determine icon and color based on activity type
  const getActivityDetails = () => {
    switch (session.activityType) {
      case 'QUIZ':
        return {
          icon: <Gamepad2 className="h-5 w-5" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          label: 'Quiz',
        };
      case 'CHAT':
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          label: 'AI Tutor',
        };
      case 'FLASHCARDS':
      case 'STUDY_PACK':
        return {
          icon: <FileText className="h-5 w-5" />,
          color: 'text-indigo-400',
          bgColor: 'bg-indigo-500/10',
          label: 'Study',
        };
      default:
        return {
          icon: <FileText className="h-5 w-5" />,
          color: 'text-slate-400',
          bgColor: 'bg-slate-500/10',
          label: 'Read',
        };
    }
  };

  const details = getActivityDetails();
  const displayName = session.fileName || session.courseName || 'Study Session';
  const timeAgo = formatDistanceToNow(new Date(session.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="
        group
        flex items-center gap-4
        bg-slate-800/30 dark:bg-slate-800/30
        hover:bg-slate-800/50 dark:hover:bg-slate-700/50
        backdrop-blur-md
        border border-slate-700/30 dark:border-slate-600/30
        rounded-xl
        p-4
        transition-all duration-200
        hover:shadow-lg
        hover:border-slate-600/50
      "
    >
      {/* Activity Icon */}
      <div className={`flex-shrink-0 p-2 rounded-lg ${details.bgColor}`}>
        <div className={details.color}>
          {details.icon}
        </div>
      </div>

      {/* Activity Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {displayName}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>{details.label}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          {session.xpEarned > 0 && (
            <>
              <span>•</span>
              <span className="text-indigo-400">+{session.xpEarned} XP</span>
            </>
          )}
        </div>
      </div>

      {/* Resume Button */}
      <motion.button
        onClick={onResume}
        whileHover={{ scale: 1.05, x: 2 }}
        whileTap={{ scale: 0.95 }}
        className="
          flex-shrink-0
          flex items-center gap-1
          px-3 py-2
          bg-indigo-600/80 hover:bg-indigo-600
          text-white text-sm font-medium
          rounded-lg
          transition-colors duration-200
          opacity-0 group-hover:opacity-100
        "
      >
        <span>Resume</span>
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

export default function RecentActivity() {
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('accessToken');

  // Fetch recent study sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/sessions/recent?limit=5`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      const data = await response.json();
      return data.sessions as StudySession[];
    },
    enabled: !!getToken(),
  });

  const handleResume = (session: StudySession) => {
    // Navigate based on activity type
    switch (session.activityType) {
      case 'QUIZ':
        navigate('/arcade');
        break;
      case 'CHAT':
        navigate('/tutor');
        break;
      case 'FLASHCARDS':
      case 'STUDY_PACK':
        if (session.fileId) {
          navigate(`/study?file=${session.fileId}`);
        } else {
          navigate('/study');
        }
        break;
      default:
        if (session.fileId) {
          navigate(`/study?file=${session.fileId}`);
        } else if (session.courseId) {
          navigate(`/courses/${session.courseId}`);
        } else {
          navigate('/study');
        }
    }
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Recent Activity
        </h2>
        <button
          onClick={() => navigate('/progress')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          View All
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="
            flex flex-col items-center justify-center
            bg-slate-800/20 dark:bg-slate-800/20
            backdrop-blur-md
            border border-slate-700/30 dark:border-slate-600/30
            rounded-xl
            p-8
            text-center
          ">
            <FileText className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No recent activity
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Start studying to see your activity here
            </p>
          </div>
        ) : (
          sessions.map((session, index) => (
            <ActivityItem
              key={session.id}
              session={session}
              index={index}
              onResume={() => handleResume(session)}
            />
          ))
        )}
      </div>
    </div>
  );
}
