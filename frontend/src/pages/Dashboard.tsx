/**
 * Dashboard Page - Command Center
 * High-performance bento-grid layout with anti-flicker skeleton loading
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Zap, 
  UploadCloud, 
  Gamepad2, 
  BookOpen, 
  FileText,
  MessageSquare,
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface UserStats {
  currentStreak: number;
  currentXP: number;
  nextLevelXP: number;
  currentLevel: number;
  totalStudyTime: number;
  weeklyGoal: number;
}

// Skeleton component matching exact bento-grid layout
function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 auto-rows-fr">
      {/* Greeting card skeleton */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      </div>

      {/* Streak card skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex-1">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Quick Actions skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 animate-pulse">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        </div>
      ))}

      {/* Recent Activity skeleton */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-6" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('accessToken');

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Fetch user stats with anti-flicker
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<UserStats>;
    },
    placeholderData: keepPreviousData,
    enabled: !!getToken(),
  });

  // Fetch recent activity with anti-flicker
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/sessions/recent?limit=3`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      const data = await response.json();
      return data.sessions as StudySession[];
    },
    placeholderData: keepPreviousData,
    enabled: !!getToken(),
  });

  const isLoading = statsLoading || sessionsLoading;

  // Fallback stats for first load or error
  const userStats = stats || {
    currentStreak: 0,
    currentXP: 0,
    nextLevelXP: 1000,
    currentLevel: 1,
    totalStudyTime: 0,
    weeklyGoal: 300,
  };

  const xpProgress = (userStats.currentXP / userStats.nextLevelXP) * 100;

  // Quick action handlers
  const handleResume = (session: StudySession) => {
    switch (session.activityType) {
      case 'QUIZ':
        navigate('/arcade');
        break;
      case 'CHAT':
        navigate('/tutor');
        break;
      case 'FLASHCARDS':
      case 'STUDY_PACK':
        navigate(session.fileId ? `/study?file=${session.fileId}` : '/study');
        break;
      default:
        if (session.fileId) navigate(`/study?file=${session.fileId}`);
        else if (session.courseId) navigate(`/courses/${session.courseId}`);
        else navigate('/study');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'QUIZ': return <Gamepad2 className="h-5 w-5" />;
      case 'CHAT': return <MessageSquare className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'QUIZ': return 'bg-purple-500/10 text-purple-400';
      case 'CHAT': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-indigo-500/10 text-indigo-400';
    }
  };

  if (isLoading && !stats && !sessions) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 auto-rows-fr">
          
          {/* Greeting Card - 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 card-hover p-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-heading mb-2">
              {greeting}, {user?.username || 'Student'}
            </h1>
            <p className="text-body text-lg">
              Ready to continue your learning journey?
            </p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-hover p-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <Flame className="h-12 w-12 text-orange-500" fill="currentColor" />
              </div>
              <div>
                <div className="text-4xl font-bold text-heading">{userStats.currentStreak}</div>
                <div className="text-sm text-body">Day Streak</div>
              </div>
            </div>
          </motion.div>

          {/* XP Progress Card - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-3 card-hover p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <div className="text-xl font-bold text-heading">Level {userStats.currentLevel}</div>
                  <div className="text-sm text-body">{userStats.currentXP} / {userStats.nextLevelXP} XP</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-500 dark:text-indigo-400">{Math.round(xpProgress)}%</div>
                <div className="text-xs text-muted">Progress</div>
              </div>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </motion.div>

          {/* Quick Action: Upload */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/study')}
            className="card-hover p-6 text-left group hover:border-blue-500/50"
          >
            <UploadCloud className="h-10 w-10 text-blue-500 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-heading mb-1">Upload Material</h3>
            <p className="text-sm text-body">Add documents or PDFs</p>
          </motion.button>

          {/* Quick Action: Quiz */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => navigate('/arcade')}
            className="card-hover p-6 text-left group hover:border-purple-500/50"
          >
            <Gamepad2 className="h-10 w-10 text-purple-500 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-heading mb-1">Start Quiz</h3>
            <p className="text-sm text-body">Test your knowledge</p>
          </motion.button>

          {/* Quick Action: Courses */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/courses')}
            className="card-hover p-6 text-left group hover:border-amber-500/50"
          >
            <BookOpen className="h-10 w-10 text-amber-500 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold text-heading mb-1">Browse Courses</h3>
            <p className="text-sm text-body">Explore learning paths</p>
          </motion.button>

          {/* Recent Activity - Full width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-3 card-hover p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-body" />
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/progress')}
                className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                View All →
              </button>
            </div>

            {!sessions || sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-slate-400 dark:text-slate-700 mb-3" />
                <h3 className="text-lg font-semibold text-body mb-1">No recent activity</h3>
                <p className="text-sm text-muted">Start studying to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="group flex items-center gap-4 bg-slate-100/50 hover:bg-slate-200/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-white/5 rounded-xl p-4 transition-all"
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(session.activityType)}`}>
                      {getActivityIcon(session.activityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-heading truncate">
                        {session.fileName || session.courseName || 'Study Session'}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted mt-1">
                        <span>{session.activityType}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</span>
                        {session.xpEarned > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400">+{session.xpEarned} XP</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResume(session)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Resume
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
