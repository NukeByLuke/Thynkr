import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import PageContainer from '@/components/PageContainer';
import {
  Flame,
  Calendar,
  Clock,
  Trophy,
  BookOpen,
  Brain,
  MessageCircle,
  FileText,
  TrendingUp,
  Star,
  Zap,
  Target,
  Award,
  Crown,
  Sparkles,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ProgressData {
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
    totalDays: number;
    totalMinutes: number;
  };
  weeklyStats: {
    sessionsCount: number;
    totalMinutes: number;
    dailyActivity: Array<{ date: string; count: number; minutes: number }>;
    activityBreakdown: Array<{ type: string; count: number; minutes: number }>;
  };
  quizPerformance: {
    recentAttempts: number;
    averageScore: number;
  };
  filesStudied: number;
}

// Badge definitions
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof Flame;
  color: string;
  bgColor: string;
  requirement: (data: ProgressData) => boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const badges: Badge[] = [
  // Streak badges
  {
    id: 'first-streak',
    name: 'Getting Started',
    description: 'Start a 3-day study streak',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    requirement: (data) => data.streak.current >= 3,
    tier: 'bronze',
  },
  {
    id: 'week-streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    requirement: (data) => data.streak.current >= 7,
    tier: 'silver',
  },
  {
    id: 'month-streak',
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    requirement: (data) => data.streak.current >= 30,
    tier: 'gold',
  },
  // Quiz badges
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    description: 'Achieve 80%+ average quiz score',
    icon: Brain,
    color: 'text-brand-500',
    bgColor: 'bg-brand-100 dark:bg-brand-900/30',
    requirement: (data) => data.quizPerformance.averageScore >= 80,
    tier: 'silver',
  },
  {
    id: 'perfect-score',
    name: 'Perfect Mind',
    description: 'Achieve 95%+ average quiz score',
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    requirement: (data) => data.quizPerformance.averageScore >= 95,
    tier: 'gold',
  },
  // Study time badges
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Study for 60+ minutes total',
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    requirement: (data) => data.streak.totalMinutes >= 60,
    tier: 'bronze',
  },
  {
    id: 'study-champion',
    name: 'Study Champion',
    description: 'Study for 300+ minutes total',
    icon: Trophy,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    requirement: (data) => data.streak.totalMinutes >= 300,
    tier: 'silver',
  },
  // Files badges
  {
    id: 'material-collector',
    name: 'Material Collector',
    description: 'Study 5+ unique files',
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    requirement: (data) => data.filesStudied >= 5,
    tier: 'bronze',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Study 20+ unique files',
    icon: BookOpen,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    requirement: (data) => data.filesStudied >= 20,
    tier: 'gold',
  },
  // Activity badges
  {
    id: 'active-learner',
    name: 'Active Learner',
    description: 'Complete 10+ study sessions this week',
    icon: Zap,
    color: 'text-brand-500',
    bgColor: 'bg-brand-100 dark:bg-brand-900/30',
    requirement: (data) => data.weeklyStats.sessionsCount >= 10,
    tier: 'silver',
  },
];

const tierColors = {
  bronze: 'border-amber-600',
  silver: 'border-gray-400',
  gold: 'border-yellow-400',
  platinum: 'border-brand-400',
};

const activityIcons: Record<string, typeof Flame> = {
  FILE_UPLOAD: FileText,
  SUMMARY_VIEW: BookOpen,
  NOTES_VIEW: FileText,
  QUIZ_ATTEMPT: Brain,
  FLASHCARD_STUDY: BookOpen,
  TUTOR_CHAT: MessageCircle,
};

const activityLabels: Record<string, string> = {
  FILE_UPLOAD: 'File Uploads',
  SUMMARY_VIEW: 'Summaries Viewed',
  NOTES_VIEW: 'Notes Reviewed',
  QUIZ_ATTEMPT: 'Quizzes Taken',
  FLASHCARD_STUDY: 'Flashcard Sessions',
  TUTOR_CHAT: 'Tutor Chats',
};

export default function StudyProgress() {
  const { data: progress, isLoading } = useQuery<ProgressData>({
    queryKey: ['study-progress'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <PageContainer>
      <PageContainer.Header subtitle="Track your learning journey and maintain your study streak">
        Study Progress
      </PageContainer.Header>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Streak */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8" />
              <span className="text-xs uppercase tracking-wide opacity-75">Current Streak</span>
            </div>
            <div className="text-4xl font-bold mb-1">{progress?.streak.current || 0}</div>
            <div className="text-sm opacity-75">days</div>
          </div>

          {/* Longest Streak */}
          <div className="bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8" />
              <span className="text-xs uppercase tracking-wide opacity-75">Best Streak</span>
            </div>
            <div className="text-4xl font-bold mb-1">{progress?.streak.longest || 0}</div>
            <div className="text-sm opacity-75">days</div>
          </div>

          {/* Total Study Time */}
          <div className="bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8" />
              <span className="text-xs uppercase tracking-wide opacity-75">Total Time</span>
            </div>
            <div className="text-4xl font-bold mb-1">
              {formatMinutes(progress?.streak.totalMinutes || 0)}
            </div>
            <div className="text-sm opacity-75">studied</div>
          </div>

          {/* Total Days */}
          <div className="bg-gradient-to-br from-accent-500 to-brand-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8" />
              <span className="text-xs uppercase tracking-wide opacity-75">Total Days</span>
            </div>
            <div className="text-4xl font-bold mb-1">{progress?.streak.totalDays || 0}</div>
            <div className="text-sm opacity-75">active days</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Weekly Activity
            </h2>
            <div className="space-y-3">
              {progress?.weeklyStats.dailyActivity.map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                    {getDayName(day.date)}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((day.count / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600 dark:text-gray-400">
                    {day.count} {day.count === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">This week total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {progress?.weeklyStats.sessionsCount || 0} sessions •{' '}
                  {formatMinutes(progress?.weeklyStats.totalMinutes || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Activity Breakdown
            </h2>
            <div className="space-y-4">
              {progress?.weeklyStats.activityBreakdown.map((activity) => {
                const Icon = activityIcons[activity.type] || BookOpen;
                return (
                  <div key={activity.type} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activityLabels[activity.type] || activity.type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.count} times • {formatMinutes(activity.minutes)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!progress?.weeklyStats.activityBreakdown ||
                progress.weeklyStats.activityBreakdown.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity this week yet.</p>
                  <p className="text-sm">Start studying to see your breakdown!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quiz Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-600" />
              Quiz Performance
            </h2>
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(progress?.quizPerformance.averageScore || 0) * 3.52} 352`}
                    className="text-primary-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {progress?.quizPerformance.averageScore || 0}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">avg score</span>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {progress?.quizPerformance.recentAttempts || 0} quizzes taken this week
            </div>
          </div>

          {/* Study Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Materials Studied
            </h2>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary-600 mb-2">
                  {progress?.filesStudied || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">unique files studied</div>
              </div>
            </div>
            {progress?.streak.lastStudyDate && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
                Last study session:{' '}
                {new Date(progress.streak.lastStudyDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
        </div>

        {/* Achievement Badges Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Achievement Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map((badge) => {
              const earned = progress ? badge.requirement(progress) : false;
              const Icon = badge.icon;

              return (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`relative p-4 rounded-xl border-2 ${tierColors[badge.tier]} ${
                    earned
                      ? 'bg-white dark:bg-gray-700'
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50 grayscale'
                  } transition-all hover:scale-105`}
                >
                  {earned && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                  )}
                  <div
                    className={`w-10 h-10 mx-auto rounded-full ${badge.bgColor} flex items-center justify-center mb-2`}
                  >
                    <Icon className={`w-5 h-5 ${badge.color}`} />
                  </div>
                  <h4 className="text-xs font-semibold text-center text-gray-900 dark:text-white truncate">
                    {badge.name}
                  </h4>
                  <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {badge.description}
                  </p>
                  {earned && (
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <Target className="w-3 h-3" />
                        Earned!
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
            {progress ? badges.filter((b) => b.requirement(progress)).length : 0} of {badges.length}{' '}
            badges earned
          </p>
        </div>

        {/* Motivation Banner */}
        {progress?.streak.current && progress.streak.current >= 3 && (
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-6 text-white text-center">
            <Flame className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-xl font-bold mb-2">
              🔥 You're on fire! {progress.streak.current} day streak!
            </h3>
            <p className="opacity-90">
              Keep it up! Consistent studying leads to better retention and results.
            </p>
          </div>
        )}
    </PageContainer>
  );
}
