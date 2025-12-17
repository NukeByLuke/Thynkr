import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
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
      <div className="h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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

  // Generate heatmap data for the last 12 weeks
  const generateHeatmapData = () => {
    const weeks = 12;
    const days = weeks * 7;
    const heatmapData: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching activity
      const activity = progress?.weeklyStats.dailyActivity.find(
        (d) => d.date.split('T')[0] === dateStr
      );
      
      heatmapData.push({
        date: dateStr,
        count: activity?.count || 0,
      });
    }

    return heatmapData;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/40 border border-slate-700/50';
    if (count <= 2) return 'bg-green-900/60 border border-green-800/50';
    if (count <= 4) return 'bg-green-700/70 border border-green-600/50';
    if (count <= 6) return 'bg-green-500/80 border border-green-400/50';
    return 'bg-green-400 border border-green-300';
  };

  const heatmapData = generateHeatmapData();
  const weeksData = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeksData.push(heatmapData.slice(i, i + 7));
  }

  return (
    <PageContainer>
      <PageContainer.Header subtitle="Track your learning journey and maintain your study streak">
        Study Progress
      </PageContainer.Header>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wide opacity-75">Current Streak</span>
          </div>
          <div className="text-4xl font-bold mb-1">{progress?.streak.current || 0}</div>
          <div className="text-sm opacity-75">days</div>
        </div>

        {/* Longest Streak */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wide opacity-75">Best Streak</span>
          </div>
          <div className="text-4xl font-bold mb-1">{progress?.streak.longest || 0}</div>
          <div className="text-sm opacity-75">days</div>
        </div>

        {/* Total Study Time */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
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
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8" />
            <span className="text-xs uppercase tracking-wide opacity-75">Total Days</span>
          </div>
          <div className="text-4xl font-bold mb-1">{progress?.streak.totalDays || 0}</div>
          <div className="text-sm opacity-75">active days</div>
        </div>
      </div>

      {/* GitHub-Style Activity Heatmap */}
      <div className="bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Study Activity (Last 12 Weeks)
        </h2>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            {weeksData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)} transition-all hover:scale-125 cursor-pointer`}
                    title={`${day.date}: ${day.count} sessions`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-800/40 border border-slate-700/50" />
              <div className="w-3 h-3 rounded-sm bg-green-900/60 border border-green-800/50" />
              <div className="w-3 h-3 rounded-sm bg-green-700/70 border border-green-600/50" />
              <div className="w-3 h-3 rounded-sm bg-green-500/80 border border-green-400/50" />
              <div className="w-3 h-3 rounded-sm bg-green-400 border border-green-300" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Full-Width Weekly Activity Chart */}
      <div className="bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          Weekly Activity
        </h2>
        <div className="space-y-3">
          {progress?.weeklyStats.dailyActivity.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-20 text-sm text-slate-600 dark:text-slate-300">
                {getDayName(day.date)}
              </div>
              <div className="flex-1 h-8 bg-slate-800/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((day.count / 10) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="w-28 text-right text-sm text-slate-600 dark:text-slate-400">
                {day.count} {day.count === 1 ? 'session' : 'sessions'}
              </div>
              <div className="w-16 text-right text-sm font-medium text-slate-900 dark:text-white">
                {formatMinutes(day.minutes)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">This week total</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {progress?.weeklyStats.sessionsCount || 0} sessions •{' '}
              {formatMinutes(progress?.weeklyStats.totalMinutes || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Breakdown */}
        <div className="bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Activity Breakdown
          </h2>
          <div className="space-y-4">
            {progress?.weeklyStats.activityBreakdown.map((activity) => {
              const Icon = activityIcons[activity.type] || BookOpen;
              return (
                <div key={activity.type} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {activityLabels[activity.type] || activity.type}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {activity.count} times • {formatMinutes(activity.minutes)}
                    </div>
                  </div>
                </div>
              );
            })}
            {(!progress?.weeklyStats.activityBreakdown ||
              progress.weeklyStats.activityBreakdown.length === 0) && (
              <div className="text-center py-8 text-slate-600 dark:text-slate-300">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity this week yet.</p>
                <p className="text-sm">Start studying to see your breakdown!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Performance */}
        <div className="bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
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
                  className="text-slate-700 dark:text-slate-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(progress?.quizPerformance.averageScore || 0) * 3.52} 352`}
                  className="text-indigo-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {progress?.quizPerformance.averageScore || 0}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">avg score</span>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-slate-600 dark:text-slate-300">
            {progress?.quizPerformance.recentAttempts || 0} quizzes taken this week
          </div>
        </div>

        {/* Study Stats */}
        <div className="bg-slate-900/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Materials Studied
          </h2>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-500 mb-2">
                {progress?.filesStudied || 0}
              </div>
              <div className="text-slate-600 dark:text-slate-400">unique files studied</div>
            </div>
          </div>
          {progress?.streak.lastStudyDate && (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-white/10">
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

      {/* Motivation Banner */}
      {progress?.streak.current && progress.streak.current >= 3 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white text-center shadow-lg">
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
