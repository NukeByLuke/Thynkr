import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Lock,
  Globe,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  X,
  Play,
  Calculator,
  Beaker,
  Laptop,
  Cog,
  Languages,
  BookMarked,
  Briefcase,
  Palette,
  HeartPulse,
  Scale,
  Sparkles,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import VisibilityChip from '@/features/courses/VisibilityChip';
import EmptyState from '@/components/ui/EmptyState';
import LazyImage from '@/components/ui/LazyImage';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  canCreatePublicCourses,
  canAccessCourses,
  canBrowsePublicCourses,
} from '@/features/auth/ProtectedRoute';

// Category Icons Mapping
const categoryIcons: Record<string, any> = {
  MATHEMATICS: Calculator,
  SCIENCE: Beaker,
  TECHNOLOGY: Laptop,
  ENGINEERING: Cog,
  LANGUAGES: Languages,
  HUMANITIES: BookMarked,
  BUSINESS: Briefcase,
  ARTS: Palette,
  HEALTH: HeartPulse,
  LAW: Scale,
  OTHER: Sparkles,
};

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: FileText },
  { value: 'MATHEMATICS', label: 'Mathematics', icon: Calculator },
  { value: 'SCIENCE', label: 'Science', icon: Beaker },
  { value: 'TECHNOLOGY', label: 'Technology', icon: Laptop },
  { value: 'ENGINEERING', label: 'Engineering', icon: Cog },
  { value: 'LANGUAGES', label: 'Languages', icon: Languages },
  { value: 'HUMANITIES', label: 'Humanities', icon: BookMarked },
  { value: 'BUSINESS', label: 'Business', icon: Briefcase },
  { value: 'ARTS', label: 'Arts', icon: Palette },
  { value: 'HEALTH', label: 'Health', icon: HeartPulse },
  { value: 'LAW', label: 'Law', icon: Scale },
  { value: 'OTHER', label: 'Other', icon: Sparkles },
];

type TabType = 'browse' | 'my-courses';

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  coverImage: string | null;
  bannerImage: string | null;
  category: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  filesCount: number;
  isOwner: boolean;
  creator: {
    id: string;
    username: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function CoursesUnified() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isDark = theme === 'dark';

  // Access control checks
  const canAccess = canAccessCourses(user?.role);
  const canBrowse = canBrowsePublicCourses(user?.role);
  const isPremium = canCreatePublicCourses(user?.role);

  const [activeTab, setActiveTab] = useState<TabType>(canBrowse ? 'browse' : 'my-courses');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC',
  });

  // Redirect Basic users to pricing page
  useEffect(() => {
    if (user && !canAccess) {
      navigate('/pricing');
    }
  }, [user, canAccess, navigate]);

  // Debounced search
  const search = useDebounce(searchInput, 300);

  // All courses use the same endpoint with different filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', activeTab, { search, category, visibility }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (visibility) params.set('visibility', visibility);

      // Add author filter based on tab
      if (activeTab === 'my-courses') {
        params.set('author', 'me');
      }

      const response = await api.get(`/user-courses?${params.toString()}`);
      return response.data;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof newCourse) => {
      const response = await api.post('/user-courses', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Course created!');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', category: 'OTHER', visibility: 'PRIVATE' });
      navigate(`/courses/${data.course.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create course');
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/user-courses/${id}`);
    },
    onSuccess: () => {
      toast.success('Course deleted');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete course');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course? All files will be removed.')) {
      deleteCourseMutation.mutate(id);
    }
    setOpenMenu(null);
  };

  const clearFilters = () => {
    setSearchInput('');
    setCategory('');
    setVisibility('');
  };

  const hasActiveFilters = searchInput || category || visibility;

  const courses = data?.courses || [];

  const getEmptyStateMessage = () => {
    if (hasActiveFilters) {
      return {
        title: 'No courses match your filters',
        description: "Try adjusting your search or filters to find what you're looking for",
        actionLabel: 'Clear Filters',
        onAction: clearFilters,
      };
    }

    if (activeTab === 'browse') {
      return {
        title: 'No public courses available',
        description: 'Be the first to create and share a public course with the community',
        actionLabel: '✨ Create Course',
        onAction: () => setShowCreateModal(true),
      };
    } else {
      return {
        title: 'No courses yet',
        description:
          'Create your first course or explore the Browse tab to discover public courses',
        actionLabel: '✨ Create Your First Course',
        onAction: () => setShowCreateModal(true),
      };
    }
  };

  const emptyState = getEmptyStateMessage();

  // Show upgrade prompt for Basic users
  if (user && !canAccess) {
    return (
      <>
        <Helmet>
          <title>Courses - Thynkr</title>
        </Helmet>
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className={`p-8 rounded-3xl shadow-2xl ${isDark ? 'bg-slate-800/50 backdrop-blur-xl' : 'bg-white shadow-2xl'}`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-aurora rounded-full mb-6">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Courses Locked</h2>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Upgrade to explore courses and create your own.</p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full px-6 py-3 bg-gradient-aurora text-white rounded-2xl font-semibold text-sm tracking-wide shadow-glow-purple hover:shadow-glow-purple-lg transition-all duration-200"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Courses - Thynkr</title>
        <meta name="description" content="Explore, create, and study smarter with Thynkr courses" />
      </Helmet>

      <div className="h-full flex flex-col overflow-hidden">
        {/* Hero Section - Homey & Inviting */}
        <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950' : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'}`}>
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-300/20'}`} />
            <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-300/20'}`} />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-12">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-4xl sm:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                Discover Your Next{' '}
                <span className="text-gradient bg-gradient-aurora">Course</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-lg mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
              >
                Transform your learning journey with AI-powered study materials
              </motion.p>

              {/* Prominent Search Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-2xl mx-auto"
              >
                <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`w-full pl-14 pr-12 py-4 rounded-2xl text-base transition-all shadow-lg focus:shadow-xl focus:ring-2 focus:ring-purple-400 ${
                    isDark 
                      ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-white placeholder-slate-500' 
                      : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-opacity-20 ${isDark ? 'text-slate-400 hover:bg-slate-600' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
            
            {/* Tab Switcher & Create Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className={`inline-flex gap-1 p-1 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                <button
                  onClick={() => canBrowse && setActiveTab('browse')}
                  disabled={!canBrowse}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'browse'
                      ? isDark 
                        ? 'bg-gradient-aurora text-white shadow-lg' 
                        : 'bg-white text-slate-900 shadow-md'
                      : canBrowse
                        ? isDark
                          ? 'text-slate-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Browse
                  {!canBrowse && <Lock className="inline-block ml-2 h-3 w-3" />}
                </button>

                <button
                  onClick={() => setActiveTab('my-courses')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'my-courses'
                      ? isDark 
                        ? 'bg-gradient-aurora text-white shadow-lg' 
                        : 'bg-white text-slate-900 shadow-md'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Courses
                </button>
              </div>

              {/* Create Button */}
              {user && canAccess && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    isDark 
                      ? 'bg-gradient-aurora text-white' 
                      : 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Create Course
                </button>
              )}
            </div>

            {/* Interactive Category Pills - Framer Motion */}
            <div className="mb-8 overflow-x-auto scrollbar-hide">
              <LayoutGroup>
                <div className="flex gap-2 pb-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = category === cat.value;
                    return (
                      <motion.button
                        key={cat.value}
                        layout
                        onClick={() => setCategory(cat.value)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                          isActive
                            ? isDark
                              ? 'text-white bg-gradient-aurora shadow-glow-purple'
                              : 'text-white bg-gradient-to-r from-purple-600 to-cyan-600 shadow-lg'
                            : isDark
                              ? 'text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 hover:text-white'
                              : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.label}
                        {isActive && (
                          <motion.div
                            layoutId="activeCategory"
                            className="absolute inset-0 bg-gradient-aurora rounded-full -z-10"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            {/* Visibility Filter (Premium Only) */}
            {isPremium && (
              <div className="flex items-center gap-3 mb-8">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Filter:</span>
                <div className={`inline-flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                  {['', 'PRIVATE', 'PUBLIC'].map((vis) => (
                    <button
                      key={vis}
                      onClick={() => setVisibility(vis)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        visibility === vis
                          ? isDark
                            ? 'bg-slate-700 text-white'
                            : 'bg-white text-slate-900 shadow-sm'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {vis === '' ? 'All' : vis === 'PRIVATE' ? 'Private' : 'Public'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Course Gallery */}
            {isLoading ? (
              <GridSkeleton count={6} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" />
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Failed to load courses</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {error instanceof Error ? error.message : 'Unknown error'}
                  </p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              /* Empty State */
              <div className="flex items-center justify-center py-20">
                <EmptyState
                  icon={<BookOpen className="h-8 w-8" />}
                  title={emptyState.title}
                  description={emptyState.description}
                  actionLabel={emptyState.actionLabel}
                  onAction={emptyState.onAction}
                  illustration={hasActiveFilters ? undefined : 'courses'}
                />
              </div>
            ) : (
              /* Premium Course Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {courses.map((course: Course, index: number) => {
                    const CategoryIcon = categoryIcons[course.category] || Sparkles;
                    return (
                      <motion.div
                        key={course.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                          delay: index * 0.03,
                          type: 'spring',
                          stiffness: 400,
                          damping: 25
                        }}
                        className={`group cursor-pointer rounded-3xl p-4 transition-all duration-200 hover:-translate-y-1 ${
                          isDark
                            ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 hover:border-purple-500/30 hover:shadow-glow-purple'
                            : 'bg-white border border-slate-200 hover:border-purple-300 hover:shadow-2xl'
                        }`}
                      >
                        {/* Course Banner with Overlay */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-md">
                          <Link to={`/courses/${course.id}`} className="block h-full">
                            {course.coverImage || course.bannerImage ? (
                              <LazyImage
                                src={course.coverImage || course.bannerImage || ''}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                isDark 
                                  ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
                                  : 'bg-gradient-to-br from-slate-100 to-slate-200'
                              }`}>
                                <CategoryIcon className={`h-16 w-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                              </div>
                            )}
                            
                            {/* Play/Open Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-xl">
                                <Play className="w-6 h-6 text-purple-600 ml-0.5" fill="currentColor" />
                              </div>
                            </div>
                          </Link>
                          
                          {/* Top Badges */}
                          <div className="absolute top-3 left-3">
                            <VisibilityChip visibility={course.visibility} size="sm" />
                          </div>

                          {/* Menu Button */}
                          {course.isOwner && (
                            <div className="absolute top-3 right-3">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenMenu(openMenu === course.id ? null : course.id);
                                }}
                                className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                                  isDark 
                                    ? 'bg-black/40 hover:bg-black/60' 
                                    : 'bg-white/60 hover:bg-white/80'
                                }`}
                              >
                                <MoreVertical className={`h-4 w-4 ${isDark ? 'text-white' : 'text-slate-700'}`} />
                              </button>

                              {openMenu === course.id && (
                                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl py-1 z-10 ${
                                  isDark 
                                    ? 'bg-slate-800 border border-slate-700' 
                                    : 'bg-white border border-slate-200'
                                }`}>
                                  <Link
                                    to={`/courses/${course.id}`}
                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                      isDark 
                                        ? 'text-white hover:bg-slate-700' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </Link>
                                  <button
                                    onClick={() => {
                                      const shareUrl = `${window.location.origin}/courses/${course.id}`;
                                      navigator.clipboard.writeText(shareUrl);
                                      toast.success('Link copied!');
                                      setOpenMenu(null);
                                    }}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                                      isDark 
                                        ? 'text-white hover:bg-slate-700' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <Share2 className="h-4 w-4" />
                                    Copy Link
                                  </button>
                                  <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />
                                  <button
                                    onClick={() => handleDelete(course.id)}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                                      isDark 
                                        ? 'text-red-400 hover:bg-red-900/20' 
                                        : 'text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <Link to={`/courses/${course.id}`} className="block space-y-3">
                          <h3 className={`text-lg font-bold line-clamp-2 group-hover:text-gradient group-hover:bg-gradient-aurora transition-all ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {course.title}
                          </h3>
                          
                          {course.description && (
                            <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {course.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                              isDark 
                                ? 'bg-slate-700/50 text-slate-300' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              <CategoryIcon className="h-3.5 w-3.5" />
                              {CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {course.filesCount} {course.filesCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl ${
              isDark 
                ? 'bg-slate-800/95 backdrop-blur-xl border border-slate-700' 
                : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-aurora rounded-xl shadow-glow-purple">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Course</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCourseMutation.mutate(newCourse);
              }}
            >
              <div className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Course Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Introduction to Calculus"
                    className={`w-full px-4 py-3 rounded-xl transition-all focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="What will students learn in this course?"
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl transition-all resize-none focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-purple-500 ${
                      isDark 
                        ? 'bg-slate-700/50 border border-slate-600 text-white' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        newCourse.visibility === 'PRIVATE'
                          ? 'border-purple-500 bg-purple-500/10'
                          : isDark
                            ? 'border-slate-600 hover:border-slate-500'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="PRIVATE"
                        checked={newCourse.visibility === 'PRIVATE'}
                        onChange={() => setNewCourse({ ...newCourse, visibility: 'PRIVATE' })}
                        className="sr-only"
                      />
                      <div
                        className={`p-2 rounded-lg ${
                          newCourse.visibility === 'PRIVATE' 
                            ? 'bg-purple-500 text-white' 
                            : isDark 
                              ? 'bg-slate-700 text-slate-400' 
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Private</p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Only you & shared links
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        !isPremium
                          ? 'opacity-50 cursor-not-allowed border-slate-300 dark:border-slate-600'
                          : newCourse.visibility === 'PUBLIC'
                            ? 'border-purple-500 bg-purple-500/10 cursor-pointer'
                            : isDark
                              ? 'border-slate-600 hover:border-slate-500 cursor-pointer'
                              : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value="PUBLIC"
                        checked={newCourse.visibility === 'PUBLIC'}
                        onChange={() => setNewCourse({ ...newCourse, visibility: 'PUBLIC' })}
                        disabled={!isPremium}
                        className="sr-only"
                      />
                      <div
                        className={`p-2 rounded-lg ${
                          newCourse.visibility === 'PUBLIC' 
                            ? 'bg-purple-500 text-white' 
                            : isDark 
                              ? 'bg-slate-700 text-slate-400' 
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Public
                          {!isPremium && (
                            <span className="ml-1 text-xs text-purple-400">
                              (Premium)
                            </span>
                          )}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Visible to all users
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className={`flex justify-end gap-3 mt-8 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-5 py-2.5 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-slate-300 hover:bg-slate-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCourse.title || createCourseMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-aurora text-white rounded-xl shadow-glow-purple hover:shadow-glow-purple-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {createCourseMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Course'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />}
    </>
  );
}
