import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Globe,
  Lock,
  FileText,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  Image,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
type CourseCategory =
  | 'MATHEMATICS'
  | 'SCIENCE'
  | 'TECHNOLOGY'
  | 'ENGINEERING'
  | 'LANGUAGES'
  | 'HUMANITIES'
  | 'BUSINESS'
  | 'ARTS'
  | 'HEALTH'
  | 'LAW'
  | 'OTHER';
type CourseVisibility = 'PUBLIC' | 'PRIVATE';

interface CourseStats {
  summary: {
    totalCourses: number;
    publicCourses: number;
    privateCourses: number;
    publishedCourses: number;
    unpublishedCourses: number;
    totalFiles: number;
    avgFilesPerCourse: number;
    coursesThisMonth: number;
    coursesLast7Days: number;
    growthRate: number;
  };
  categoryDistribution: { category: CourseCategory; count: number }[];
}

interface CourseCreator {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  totalCourses: number;
  publicCourses: number;
  privateCourses: number;
  totalFiles: number;
  avgFilesPerCourse: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  bannerImage: string | null;
  coverImage: string | null;
  category: CourseCategory;
  visibility: CourseVisibility;
  published: boolean;
  creator: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  fileCount: number;
  createdAt: string;
}

interface CourseTrends {
  monthly: { month: string; courses: number }[];
  daily: { date: string; courses: number }[];
}

// Helper components
const PaymentMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend: _trend,
  trendValue: _trendValue,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple';
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="admin-surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 sm:p-2.5 rounded-xl ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
};

const Modal = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
          <div
            className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-surface-strong rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
};

const SidePanel = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <>
    {open && (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-full md:max-w-xl bg-white/95 dark:bg-slate-950/90 shadow-2xl z-50 overflow-y-auto border-l border-rose-200/70 dark:border-cyan-400/20 transition-transform">
          {children}
        </div>
      </>
    )}
  </>
);

// Category colors and labels
const CATEGORY_CONFIG: Record<CourseCategory, { label: string; color: string; bgColor: string }> =
  {
    MATHEMATICS: {
      label: 'Mathematics',
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    SCIENCE: {
      label: 'Science',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    TECHNOLOGY: {
      label: 'Technology',
      color: 'text-purple-700 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    ENGINEERING: {
      label: 'Engineering',
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    LANGUAGES: {
      label: 'Languages',
      color: 'text-violet-700 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    },
    HUMANITIES: {
      label: 'Humanities',
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    BUSINESS: {
      label: 'Business',
      color: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    ARTS: {
      label: 'Arts',
      color: 'text-pink-700 dark:text-cyan-400',
      bgColor: 'bg-pink-100 dark:bg-cyan-900/30',
    },
    HEALTH: {
      label: 'Health',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    LAW: {
      label: 'Law',
      color: 'text-slate-700 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    },
    OTHER: {
      label: 'Other',
      color: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
  };

const CATEGORY_PIE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#ef4444',
  '#64748b',
  '#6b7280',
];

// Course Insights Tab Component
const CourseInsightsTab = () => {
  const queryClient = useQueryClient();
  const [chartType, setChartType] = useState<'monthly' | 'daily'>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | ''>('');
  const [visibilityFilter, setVisibilityFilter] = useState<CourseVisibility | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);
  const [creatorsPage, setCreatorsPage] = useState(1);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [courseToToggle, setCourseToToggle] = useState<Course | null>(null);

  // Fetch course stats
  const { data: stats, isLoading: statsLoading } = useQuery<CourseStats>({
    queryKey: ['admin-course-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/course-stats');
      return res.data;
    },
  });

  // Fetch course trends
  const { data: trends, isLoading: trendsLoading } = useQuery<CourseTrends>({
    queryKey: ['admin-course-trends'],
    queryFn: async () => {
      const res = await api.get('/admin/course-trends');
      return res.data;
    },
  });

  // Fetch top creators
  const { data: creatorsData, isLoading: creatorsLoading } = useQuery<{
    creators: CourseCreator[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-course-creators', creatorsPage],
    queryFn: async () => {
      const res = await api.get(`/admin/course-creators?page=${creatorsPage}&limit=10`);
      return res.data;
    },
  });

  // Fetch recent courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{
    courses: Course[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-recent-courses', coursesPage, categoryFilter, visibilityFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(coursesPage));
      params.append('limit', '12');
      if (categoryFilter) params.append('category', categoryFilter);
      if (visibilityFilter) params.append('visibility', visibilityFilter);
      if (searchQuery) params.append('search', searchQuery);
      const res = await api.get(`/admin/courses/recent?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch selected user's courses
  const { data: userCoursesData, isLoading: userCoursesLoading } = useQuery<{
    user: { id: string; email: string; firstName: string | null; lastName: string | null };
    courses: Course[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-user-courses', selectedCreatorId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${selectedCreatorId}/courses?limit=50`);
      return res.data;
    },
    enabled: !!selectedCreatorId,
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visibility }: { id: string; visibility: CourseVisibility }) => {
      const res = await api.patch(`/admin/courses/${id}/visibility`, { visibility });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-creators'] });
      if (selectedCreatorId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-courses', selectedCreatorId] });
      }
      setVisibilityModalOpen(false);
      setCourseToToggle(null);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/courses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-creators'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-trends'] });
      if (selectedCreatorId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-courses', selectedCreatorId] });
      }
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    },
  });

  const handleToggleVisibility = (course: Course) => {
    setCourseToToggle(course);
    setVisibilityModalOpen(true);
  };

  const confirmToggleVisibility = () => {
    if (courseToToggle) {
      const newVisibility = courseToToggle.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      toggleVisibilityMutation.mutate({ id: courseToToggle.id, visibility: newVisibility });
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      deleteCourseMutation.mutate(courseToDelete.id);
    }
  };

  // Pie chart data for categories
  const categoryPieData = useMemo(() => {
    if (!stats?.categoryDistribution) return [];
    return stats.categoryDistribution.map((c, i) => ({
      name: CATEGORY_CONFIG[c.category]?.label || c.category,
      value: c.count,
      fill: CATEGORY_PIE_COLORS[i % CATEGORY_PIE_COLORS.length],
    }));
  }, [stats?.categoryDistribution]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading course insights...
        </div>
      </div>
    );
  }

  const summary = stats?.summary;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <PaymentMetricCard
          title="Total Courses"
          value={String(summary?.totalCourses || 0)}
          subtitle={`${summary?.coursesThisMonth || 0} this month`}
          icon={BookOpen}
          trend={
            summary?.growthRate && summary.growthRate > 0
              ? 'up'
              : summary?.growthRate && summary.growthRate < 0
                ? 'down'
                : 'neutral'
          }
          trendValue={`${summary?.growthRate || 0}%`}
          color="blue"
        />
        <PaymentMetricCard
          title="Public Courses"
          value={String(summary?.publicCourses || 0)}
          subtitle={`${summary?.privateCourses || 0} private`}
          icon={Globe}
          color="green"
        />
        <PaymentMetricCard
          title="Avg Files per Course"
          value={String(summary?.avgFilesPerCourse || 0)}
          subtitle={`${summary?.totalFiles || 0} total files`}
          icon={FileText}
          color="purple"
        />
        <PaymentMetricCard
          title="New This Week"
          value={String(summary?.coursesLast7Days || 0)}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Visibility Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2 text-emerald-100">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Public Courses</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{summary?.publicCourses || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2 text-amber-100">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Private Courses</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{summary?.privateCourses || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Published</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{summary?.publishedCourses || 0}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Course Creation Trend Chart */}
        <div className="admin-surface lg:col-span-2 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Course Creation Trend
            </h3>
            <div className="admin-segment grid grid-cols-2 gap-1 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'monthly'
                    ? 'admin-segment-btn-active'
                    : 'admin-segment-btn'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'daily'
                    ? 'admin-segment-btn-active'
                    : 'admin-segment-btn'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            {trendsLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'monthly' ? (
                  <BarChart
                    data={trends?.monthly || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <RechartsTooltip
                      content={(props) => {
                        const { active, payload, label } = props as { active?: boolean; payload?: readonly { value?: number }[]; label?: string };
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-400">{payload[0].value} courses</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="courses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={trends?.daily || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <RechartsTooltip
                      content={(props) => {
                        const { active, payload, label } = props as { active?: boolean; payload?: readonly { value?: number }[]; label?: string };
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-400">{payload[0].value} courses</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="courses"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCourses)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="admin-surface rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Category Distribution
          </h3>
          <div className="h-44 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={(props) => {
                    const { active, payload } = props as { active?: boolean; payload?: readonly { name?: string; value?: number }[] };
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                          <p className="font-medium">{payload[0].name}</p>
                          <p className="text-blue-400">{payload[0].value} courses</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryPieData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Creators Table */}
      <div className="admin-surface rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-rose-200/60 dark:border-cyan-400/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Course Creators
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on a creator to view their courses
          </p>
        </div>

        <div className="md:hidden divide-y divide-rose-100 dark:divide-slate-700">
          {creatorsLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading creators...
              </div>
            </div>
          ) : !creatorsData?.creators?.length ? (
            <div className="px-4 py-10 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No course creators yet</p>
            </div>
          ) : (
            creatorsData.creators.map((creator, index) => (
              <button
                key={creator.userId}
                onClick={() => setSelectedCreatorId(creator.userId)}
                className="w-full text-left px-4 py-3 hover:bg-rose-50/60 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                        index === 0
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                          : index === 1
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                            : index === 2
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                              : 'bg-gradient-to-br from-blue-500 to-purple-500'
                      }`}
                    >
                      {index < 3 ? index + 1 : creator.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {creator.firstName && creator.lastName
                          ? `${creator.firstName} ${creator.lastName}`
                          : creator.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {creator.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {creator.totalCourses}
                    </p>
                    courses
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    {creator.publicCourses}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-500" />
                    {creator.privateCourses}
                  </span>
                  <span>{creator.totalFiles} files</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="admin-table-head">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Creator
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Courses
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Visibility Mix
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Files
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Files/Course
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100 dark:divide-slate-700">
              {creatorsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading creators...
                    </div>
                  </td>
                </tr>
              ) : !creatorsData?.creators?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No course creators yet</p>
                  </td>
                </tr>
              ) : (
                creatorsData.creators.map((creator, index) => (
                  <tr
                    key={creator.userId}
                    className="hover:bg-rose-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCreatorId(creator.userId)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            index === 0
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                              : index === 1
                                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                : index === 2
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
                          }`}
                        >
                          {index < 3 ? index + 1 : creator.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {creator.firstName && creator.lastName
                              ? `${creator.firstName} ${creator.lastName}`
                              : creator.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {creator.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {creator.totalCourses}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {creator.publicCourses}
                          </span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {creator.privateCourses}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">{creator.totalFiles}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        {creator.avgFilesPerCourse}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCreatorId(creator.userId);
                        }}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-500 hover:text-pink-600 dark:hover:text-cyan-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {creatorsData && creatorsData.pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-t border-rose-200/60 dark:border-cyan-400/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {creatorsData.pagination.page} of {creatorsData.pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCreatorsPage((p) => Math.max(1, p - 1))}
                disabled={creatorsPage === 1}
                className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCreatorsPage((p) => Math.min(creatorsData.pagination.pages, p + 1))
                }
                disabled={creatorsPage >= creatorsData.pagination.pages}
                className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Courses Grid */}
      <div className="admin-surface rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-rose-200/60 dark:border-cyan-400/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Courses
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Browse and manage courses
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 w-full sm:w-auto sm:min-w-[560px]">
              <div className="relative sm:col-span-2 xl:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCoursesPage(1);
                  }}
                  className="admin-input w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as CourseCategory | '');
                  setCoursesPage(1);
                }}
                className="admin-select w-full px-4 py-2 rounded-xl text-sm"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => {
                  setVisibilityFilter(e.target.value as CourseVisibility | '');
                  setCoursesPage(1);
                }}
                className="admin-select w-full px-4 py-2 rounded-xl text-sm"
              >
                <option value="">All Visibility</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading courses...
            </div>
          ) : !coursesData?.courses?.length ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No courses found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchQuery || categoryFilter || visibilityFilter
                  ? 'Try adjusting your filters'
                  : 'Courses will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {coursesData.courses.map((course) => (
                <div
                  key={course.id}
                  className="admin-soft-chip rounded-xl overflow-hidden hover:-translate-y-1 transition-transform"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-rose-100 to-orange-100 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden">
                    {course.coverImage || course.bannerImage ? (
                      <img
                        src={course.coverImage || course.bannerImage || ''}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                    )}
                    {/* Visibility Badge */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        course.visibility === 'PUBLIC'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {course.visibility === 'PUBLIC' ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {course.visibility}
                    </div>
                  </div>

                  <div className="p-4">
                    <h4
                      className="font-semibold text-gray-900 dark:text-white truncate"
                      title={course.title}
                    >
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {course.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_CONFIG[course.category]?.bgColor} ${CATEGORY_CONFIG[course.category]?.color}`}
                      >
                        {CATEGORY_CONFIG[course.category]?.label || course.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {course.fileCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-rose-100 dark:border-slate-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(course.createdAt), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleVisibility(course)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-slate-700 text-gray-500 hover:text-pink-600 dark:hover:text-cyan-300 transition-colors"
                          title={`Make ${course.visibility === 'PUBLIC' ? 'Private' : 'Public'}`}
                        >
                          {course.visibility === 'PUBLIC' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {coursesData && coursesData.pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-4 border-t border-rose-200/60 dark:border-cyan-400/20">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(coursesPage - 1) * 12 + 1} to{' '}
                {Math.min(coursesPage * 12, coursesData.pagination.total)} of{' '}
                {coursesData.pagination.total} courses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
                  disabled={coursesPage === 1}
                  className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCoursesPage((p) => Math.min(coursesData.pagination.pages, p + 1))
                  }
                  disabled={coursesPage >= coursesData.pagination.pages}
                  className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Courses Side Panel */}
      <SidePanel open={!!selectedCreatorId} onClose={() => setSelectedCreatorId(null)}>
        {selectedCreatorId && userCoursesData && (
          <div>
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 relative">
              <button
                onClick={() => setSelectedCreatorId(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-slate-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-10">
                Courses by{' '}
                {userCoursesData.user.firstName || userCoursesData.user.email.split('@')[0]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {userCoursesData.user.email} • {userCoursesData.pagination.total} courses
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
              {userCoursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !userCoursesData?.courses?.length ? (
                <div className="text-center py-12 text-gray-500">No courses found</div>
              ) : (
                userCoursesData.courses.map((course) => (
                  <div
                    key={course.id}
                    className="admin-soft-chip flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl"
                  >
                    <div className="w-16 h-12 rounded-lg bg-rose-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                      {course.coverImage || course.bannerImage ? (
                        <img
                          src={course.coverImage || course.bannerImage || ''}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Image className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            course.visibility === 'PUBLIC'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {course.visibility}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {course.fileCount} files
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVisibility(course)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-slate-700 text-gray-500 hover:text-pink-600 dark:hover:text-cyan-300 transition-colors"
                      >
                        {course.visibility === 'PUBLIC' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </SidePanel>

      {/* Toggle Visibility Modal */}
      <Modal open={visibilityModalOpen} onClose={() => setVisibilityModalOpen(false)}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              {courseToToggle?.visibility === 'PUBLIC' ? (
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Visibility
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Make this course {courseToToggle?.visibility === 'PUBLIC' ? 'private' : 'public'}?
              </p>
            </div>
          </div>

          <div className="admin-soft-chip rounded-xl p-4 mb-6">
            <p className="font-medium text-gray-900 dark:text-white">{courseToToggle?.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {courseToToggle?.visibility} → New:{' '}
              {courseToToggle?.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setVisibilityModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200/80 dark:border-cyan-400/20 text-gray-700 dark:text-gray-300 font-medium hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmToggleVisibility}
              disabled={toggleVisibilityMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 dark:from-cyan-500 dark:to-blue-500 text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {toggleVisibilityMutation.isPending ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Course</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-6 border border-red-100 dark:border-red-900/30">
            <p className="font-medium text-red-800 dark:text-red-400">{courseToDelete?.title}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              This will permanently delete the course and all {courseToDelete?.fileCount || 0}{' '}
              associated files.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-rose-200/80 dark:border-cyan-400/20 text-gray-700 dark:text-gray-300 font-medium hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteCourse}
              disabled={deleteCourseMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { CourseInsightsTab as CourseInsights };
export default CourseInsightsTab;
