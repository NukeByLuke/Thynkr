import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import VisibilityChip from '@/features/courses/VisibilityChip';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import {
  canCreatePublicCourses,
  canAccessCourses,
  canBrowsePublicCourses,
} from '@/features/auth/ProtectedRoute';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'SCIENCE', label: 'Science' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LANGUAGES', label: 'Languages' },
  { value: 'HUMANITIES', label: 'Humanities' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ARTS', label: 'Arts' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'LAW', label: 'Law' },
  { value: 'OTHER', label: 'Other' },
];

// Category gradient colors
const CATEGORY_GRADIENTS: Record<string, string> = {
  MATHEMATICS: 'from-blue-500 to-indigo-600',
  SCIENCE: 'from-emerald-500 to-teal-600',
  TECHNOLOGY: 'from-violet-500 to-purple-600',
  ENGINEERING: 'from-orange-500 to-red-600',
  LANGUAGES: 'from-pink-500 to-rose-600',
  HUMANITIES: 'from-amber-500 to-yellow-600',
  BUSINESS: 'from-slate-500 to-gray-600',
  ARTS: 'from-fuchsia-500 to-pink-600',
  HEALTH: 'from-green-500 to-emerald-600',
  LAW: 'from-indigo-500 to-blue-600',
  OTHER: 'from-gray-500 to-slate-600',
};

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

// Skeleton Loader for Course Gallery


export default function CoursesUnified() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center max-w-md px-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-slate-700/20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full mb-6">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3">Courses Locked</h2>
              <p className="text-slate-400 mb-6">Upgrade to explore courses and create your own.</p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl font-semibold text-sm tracking-wide shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] transition-all duration-200"
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

      <div className="h-full flex flex-col bg-slate-950">
        {/* Hero Header with Gradient */}
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-slate-950/60 to-slate-950" />
          
          <div className="relative max-w-[1400px] mx-auto px-8 py-12">
            <h1 className="text-4xl font-bold text-white mb-2">Courses</h1>
            <p className="text-slate-400 text-lg">
              Explore, create, and organize your learning materials
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 pt-6 pb-10">
            {/* Tab Switcher & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex gap-2">
                <button
                  onClick={() => canBrowse && setActiveTab('browse')}
                  disabled={!canBrowse}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'browse'
                      ? 'bg-white text-slate-950'
                      : canBrowse
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  Browse
                  {!canBrowse && <Lock className="inline-block ml-2 h-3 w-3" />}
                </button>

                <button
                  onClick={() => setActiveTab('my-courses')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'my-courses'
                      ? 'bg-white text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  My Courses
                </button>
              </div>

              {/* Create Button */}
              {user && canAccess && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-950 rounded-full font-medium hover:bg-white/90 transition"
                >
                  <Plus className="h-4 w-4" />
                  Create Course
                </button>
              )}
            </div>
            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                {/* Category */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-slate-700 cursor-pointer min-w-[160px]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                {/* Visibility (Premium only) */}
                {isPremium && (
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-slate-700 cursor-pointer min-w-[140px]"
                  >
                    <option value="">All Visibility</option>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                )}

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            {/* Course Gallery */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4 animate-pulse">
                      <div className="aspect-video bg-slate-800 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">Failed to load courses</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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
                /* Streaming-Style Course Gallery */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                  <AnimatePresence>
                    {courses.map((course: Course, index: number) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group cursor-pointer"
                      >
                        {/* Cover Image with Hover Play Button */}
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                          <Link to={`/courses/${course.id}`} className="block h-full">
                            {course.coverImage ? (
                              <img
                                src={course.coverImage}
                                alt={course.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div
                                className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[course.category] || CATEGORY_GRADIENTS.OTHER} flex items-center justify-center`}
                              >
                                <BookOpen className="h-16 w-16 text-white/60" />
                              </div>
                            )}
                            
                            {/* Play/Resume Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <Play className="w-8 h-8 text-slate-950 ml-1" fill="currentColor" />
                              </div>
                            </div>
                          </Link>
                          
                          {/* Visibility Badge */}
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
                                className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-white" />
                              </button>

                              {openMenu === course.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-slate-900 rounded-lg shadow-xl py-1 z-10 border border-slate-800">
                                  <Link
                                    to={`/courses/${course.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
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
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-slate-800"
                                  >
                                    <Share2 className="h-4 w-4" />
                                    Copy Link
                                  </button>
                                  <hr className="my-1 border-slate-800" />
                                  <button
                                    onClick={() => handleDelete(course.id)}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Content Below Image */}
                        <Link to={`/courses/${course.id}`} className="block">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-500 uppercase tracking-wide">
                              {CATEGORIES.find((c) => c.value === course.category)?.label ||
                                course.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-600">•</span>
                            <span className="text-xs text-slate-500">
                              {course.filesCount} {course.filesCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold text-white mb-1 line-clamp-2 group-hover:text-slate-300 transition-colors">
                            {course.title}
                          </h3>

                          <p className="text-sm text-slate-500 truncate">
                            {course.creator.name}
                          </p>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="backdrop-blur-lg bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] w-full max-w-lg p-6 border border-white/20 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Create New Course</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCourseMutation.mutate(newCourse);
              }}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Course Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Introduction to Calculus"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="What will students learn in this course?"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        newCourse.visibility === 'PRIVATE'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                        className={`p-2 rounded-lg ${newCourse.visibility === 'PRIVATE' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                      >
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100 text-sm">Private</p>
                        <p className="text-xs text-slate-400">
                          Only you & shared links
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        !isPremium
                          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-600'
                          : newCourse.visibility === 'PUBLIC'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
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
                        className={`p-2 rounded-lg ${newCourse.visibility === 'PUBLIC' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                      >
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100 text-sm">
                          Public
                          {!isPremium && (
                            <span className="ml-1 text-xs text-indigo-400">
                              (Premium)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          Visible to all users
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-slate-300 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCourse.title || createCourseMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-[0_8px_30px_rgba(124,58,237,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
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
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />}
    </>
  );
}
