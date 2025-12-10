import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  Filter,
  User,
  Calendar,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/layout/PageHeader';
import VisibilityChip from '@/features/courses/VisibilityChip';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { canCreatePublicCourses } from '@/features/auth/ProtectedRoute';

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
  TECHNOLOGY: 'from-brand-600 to-accent-600',
  ENGINEERING: 'from-orange-500 to-red-600',
  LANGUAGES: 'from-pink-500 to-rose-600',
  HUMANITIES: 'from-amber-500 to-yellow-600',
  BUSINESS: 'from-slate-500 to-gray-600',
  ARTS: 'from-fuchsia-500 to-pink-600',
  HEALTH: 'from-green-500 to-emerald-600',
  LAW: 'from-brand-600 to-accent-600',
  OTHER: 'from-gray-500 to-slate-600',
};

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

export default function MyCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC',
  });

  // Check if user can create public courses (Premium/Admin only)
  const isPremium = canCreatePublicCourses(user?.role);

  // Debounced search
  const search = useDebounce(searchInput, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-courses', { search, category, visibility, author: authorFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (visibility) params.set('visibility', visibility);
      if (authorFilter) params.set('author', authorFilter);
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
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', category: 'OTHER', visibility: 'PRIVATE' });
      navigate(`/my-courses/${data.course.id}`);
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
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
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
    setAuthorFilter('');
  };

  const hasActiveFilters = searchInput || category || visibility || authorFilter !== '';

  const courses = data?.courses || [];

  return (
    <>
      <Helmet>
        <title>My Courses - Thynkr</title>
        <meta name="description" content="Create and manage your personal courses on Thynkr" />
      </Helmet>

      <div className="min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <PageHeader
            icon={<BookOpen className="h-6 w-6" />}
            title="📚 My Courses"
            description="Create, organize, and share your learning materials"
            actions={
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:scale-[1.02]"
              >
                <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                Create Course
              </button>
            }
          />

          {/* Search & Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by title or description..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Filter className="h-5 w-5" />
                Filters
                {hasActiveFilters && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                    {[category, visibility, authorFilter !== ''].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Filters (Desktop always visible, Mobile toggleable) */}
              <div
                className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row gap-3`}
              >
                {/* Category */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer min-w-[160px]"
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
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer min-w-[140px]"
                  >
                    <option value="">All Visibility</option>
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                )}

                {/* Author filter (Premium only) */}
                {isPremium && (
                  <select
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer min-w-[140px]"
                  >
                    <option value="me">My Courses</option>
                    <option value="">All Authors</option>
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
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title={
                  hasActiveFilters
                    ? 'No courses match your filters'
                    : 'Start learning by creating your first course'
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your search or filters to find what you're looking for"
                    : 'Your knowledge, your way! Build personalized courses with your own study materials and organize them however works best for you.'
                }
                actionLabel={hasActiveFilters ? 'Clear Filters' : '✨ Create Your First Course'}
                onAction={hasActiveFilters ? clearFilters : () => setShowCreateModal(true)}
                illustration={hasActiveFilters ? undefined : 'courses'}
              />
            </div>
          ) : (
            /* Courses Grid */
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: Course) => (
                <div
                  key={course.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-1"
                >
                  {/* Cover Image */}
                  <Link to={`/my-courses/${course.id}`} className="block">
                    <div className="relative h-44 overflow-hidden">
                      {course.coverImage ? (
                        <img
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[course.category] || CATEGORY_GRADIENTS.OTHER} flex items-center justify-center`}
                        >
                          <BookOpen className="h-14 w-14 text-white/80 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Link>

                  {/* Visibility Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="backdrop-blur-sm">
                      <VisibilityChip visibility={course.visibility} size="sm" />
                    </div>
                  </div>

                  {/* Menu Button (only for owner) */}
                  {course.isOwner && (
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMenu(openMenu === course.id ? null : course.id);
                        }}
                        className="p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>

                      {openMenu === course.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-10 border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Link
                            to={`/my-courses/${course.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Course
                          </Link>
                          <button
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/my-courses/${course.id}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast.success('Link copied!');
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Share2 className="h-4 w-4" />
                            Copy Link
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => handleDelete(course.id)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <Link to={`/my-courses/${course.id}`} className="block p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-lg">
                        {CATEGORIES.find((c) => c.value === course.category)?.label ||
                          course.category.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {course.description ? (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-sm mb-4 italic">
                        No description
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {course.filesCount} {course.filesCount === 1 ? 'file' : 'files'}
                        </span>
                      </div>
                      {!course.isOwner && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span className="truncate max-w-[100px]">{course.creator.name}</span>
                        </div>
                      )}
                      {course.isOwner && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(course.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Course</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCourseMutation.mutate(newCourse);
              }}
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Title <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                        <p className="font-medium text-gray-900 dark:text-white text-sm">Private</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          Public
                          {!isPremium && (
                            <span className="ml-1 text-xs text-primary-600 dark:text-primary-400">
                              (Premium)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Visible to all users
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCourse.title || createCourseMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
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
      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </>
  );
}
