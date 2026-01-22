/**
 * Courses Page - Quizlet-inspired Library Design
 * 
 * A warm, inviting "library" experience for browsing and managing courses.
 * Features glassmorphism, smooth animations, and a personal touch.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Lock,
  Globe,
  MoreVertical,
  Trash2,
  Edit,
  Share2,
  X,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  FolderPlus,
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
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import PageContainer from '@/components/layout/PageContainer';
import GlassCard from '@/components/ui/GlassCard';
import EmptyState from '@/components/ui/EmptyState';
import LazyImage from '@/components/ui/LazyImage';
import { GridSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { canCreatePublicCourses } from '@/features/auth/ProtectedRoute';

// ============================================================================
// Types & Constants
// ============================================================================

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

const CATEGORIES = [
  { value: '', label: 'All', icon: BookOpen },
  { value: 'MATHEMATICS', label: 'Math', icon: Calculator },
  { value: 'SCIENCE', label: 'Science', icon: Beaker },
  { value: 'TECHNOLOGY', label: 'Tech', icon: Laptop },
  { value: 'ENGINEERING', label: 'Engineering', icon: Cog },
  { value: 'LANGUAGES', label: 'Languages', icon: Languages },
  { value: 'HUMANITIES', label: 'Humanities', icon: BookMarked },
  { value: 'BUSINESS', label: 'Business', icon: Briefcase },
  { value: 'ARTS', label: 'Arts', icon: Palette },
  { value: 'HEALTH', label: 'Health', icon: HeartPulse },
  { value: 'LAW', label: 'Law', icon: Scale },
  { value: 'OTHER', label: 'Other', icon: Sparkles },
];

const categoryIcons: Record<string, typeof BookOpen> = {
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

// ============================================================================
// Hooks
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Sub-components
// ============================================================================

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
}

function CreateCourseModal({ isOpen, onClose, isPremium }: CreateCourseModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    visibility: 'PRIVATE' as 'PRIVATE' | 'PUBLIC',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCourse) => {
      const response = await api.post('/user-courses', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Course created!');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      onClose();
      setNewCourse({ title: '', description: '', category: 'OTHER', visibility: 'PRIVATE' });
      navigate(`/courses/${data.course.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create course');
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${
          isDark 
            ? 'bg-slate-900/95 backdrop-blur-xl border border-slate-800' 
            : 'bg-white/95 backdrop-blur-xl border border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-xl">
            <FolderPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create a new set</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Organize your study materials</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newCourse);
          }}
        >
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                placeholder='e.g., "Biology 101 Midterm"'
                className={`w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                placeholder="Add a description..."
                rows={2}
                className={`w-full px-4 py-3 rounded-xl transition-all resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500' 
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-700 text-white' 
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

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    newCourse.visibility === 'PRIVATE'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : isDark
                        ? 'border-slate-700 hover:border-slate-600'
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
                  <Lock className={`h-4 w-4 ${newCourse.visibility === 'PRIVATE' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${newCourse.visibility === 'PRIVATE' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    Private
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    !isPremium
                      ? 'opacity-50 cursor-not-allowed'
                      : newCourse.visibility === 'PUBLIC'
                        ? 'border-indigo-500 bg-indigo-500/10 cursor-pointer'
                        : isDark
                          ? 'border-slate-700 hover:border-slate-600 cursor-pointer'
                          : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={newCourse.visibility === 'PUBLIC'}
                    onChange={() => isPremium && setNewCourse({ ...newCourse, visibility: 'PUBLIC' })}
                    disabled={!isPremium}
                    className="sr-only"
                  />
                  <Globe className={`h-4 w-4 ${newCourse.visibility === 'PUBLIC' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${newCourse.visibility === 'PUBLIC' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    Public {!isPremium && <span className="text-xs text-purple-500">(Pro)</span>}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newCourse.title || createMutation.isPending}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Set'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Course Card Component
interface CourseCardProps {
  course: Course;
  onDelete: (id: string) => void;
  onMenuToggle: (id: string | null) => void;
  isMenuOpen: boolean;
}

function CourseCard({ course, onDelete, onMenuToggle, isMenuOpen }: CourseCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const CategoryIcon = categoryIcons[course.category] || Sparkles;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Link to={`/courses/${course.id}`}>
        <GlassCard
          variant="interactive"
          className="h-full overflow-hidden"
        >
          {/* Cover Image / Gradient Background */}
          <div className="relative h-32 overflow-hidden">
            {course.bannerImage || course.coverImage ? (
              <LazyImage
                src={course.bannerImage || course.coverImage || ''}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <CategoryIcon className="h-12 w-12 text-slate-400/50 dark:text-slate-600/50" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            
            {/* Visibility badge */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                course.visibility === 'PUBLIC'
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-slate-900/60 text-white'
              }`}>
                {course.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {course.visibility === 'PUBLIC' ? 'Public' : 'Private'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 mb-1">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {course.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <CategoryIcon className="h-3 w-3" />
                  {CATEGORIES.find((c) => c.value === course.category)?.label || 'Other'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <FileText className="h-3 w-3" />
                {course.filesCount} {course.filesCount === 1 ? 'file' : 'files'}
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>

      {/* Menu Button */}
      {course.isOwner && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuToggle(isMenuOpen ? null : course.id);
            }}
            className="p-2 rounded-lg bg-slate-900/60 backdrop-blur-md text-white hover:bg-slate-900/80 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <div
              className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl py-1.5 z-20 ${
                isDark 
                  ? 'bg-slate-800 border border-slate-700' 
                  : 'bg-white border border-slate-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                to={`/courses/${course.id}`}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm ${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-700' 
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
                  onMenuToggle(null);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm ${
                  isDark 
                    ? 'text-slate-300 hover:bg-slate-700' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Share2 className="h-4 w-4" />
                Copy Link
              </button>
              <hr className={`my-1.5 ${isDark ? 'border-slate-700' : 'border-slate-200'}`} />
              <button
                onClick={() => {
                  onDelete(course.id);
                  onMenuToggle(null);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm ${
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
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Courses() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const isDark = theme === 'dark';
  const isPremium = canCreatePublicCourses(user?.role);

  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const search = useDebounce(searchInput, 300);

  // Fetch courses
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses', { search, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('author', 'me'); // Only show user's courses
      const response = await api.get(`/user-courses?${params.toString()}`);
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
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
    if (window.confirm('Are you sure you want to delete this set? All files will be removed.')) {
      deleteMutation.mutate(id);
    }
  };

  const courses: Course[] = data?.courses || [];

  // Get recent courses (last 4 accessed)
  const recentCourses = useMemo(() => {
    return [...courses]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [courses]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.firstName || user?.username || 'there';

  return (
    <>
      <Helmet>
        <title>Your Library - Thynkr</title>
        <meta name="description" content="Browse and manage your study sets" />
      </Helmet>

      <PageContainer>
        {/* Personalized Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2"
          >
            {getGreeting()},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">
              {firstName}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400"
          >
            What are we learning today?
          </motion.p>
        </div>

        {/* Search & Create */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className={`relative rounded-xl overflow-hidden ${
              isDark 
                ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' 
                : 'bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm'
            }`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search your sets..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`w-full pl-11 pr-10 py-3 bg-transparent focus:outline-none text-sm ${
                  isDark 
                    ? 'text-white placeholder-slate-500' 
                    : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Create Set
          </button>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 -mx-4 px-4 overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-2 min-w-max pb-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-md'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Jump Back In - Recent Courses */}
        {recentCourses.length > 0 && !search && !category && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                Jump back in
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl transition-all ${
                      isDark
                        ? 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50'
                        : 'bg-white/80 hover:bg-white border border-slate-200/50 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {(() => {
                          const Icon = categoryIcons[course.category] || Sparkles;
                          return <Icon className="h-4 w-4 text-indigo-500" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {course.filesCount} {course.filesCount === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Main Course Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              {search || category ? 'Search Results' : 'Your Sets'}
            </h2>
            {courses.length > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {courses.length} {courses.length === 1 ? 'set' : 'sets'}
              </span>
            )}
          </div>

          {isLoading ? (
            <GridSkeleton count={6} columns={{ sm: 2, md: 2, lg: 3 }} aspectRatio="video" />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">Failed to load courses</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="py-12">
              {search || category ? (
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No sets found"
                  description="Try adjusting your search or filters"
                  actionLabel="Clear filters"
                  onAction={() => {
                    setSearchInput('');
                    setCategory('');
                  }}
                />
              ) : (
                <EmptyState
                  icon={<GraduationCap className="h-8 w-8" />}
                  title="Create your first study set"
                  description="Upload your notes, PDFs, or documents and let AI help you study smarter"
                  actionLabel="Create Set"
                  onAction={() => setShowCreateModal(true)}
                  illustration="study"
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Create New Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => setShowCreateModal(true)}
                className={`h-full min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDark
                    ? 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                }`}
              >
                <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20">
                  <Plus className="h-6 w-6 text-indigo-500" />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Create new set
                </span>
              </motion.div>

              {/* Course Cards */}
              <AnimatePresence mode="popLayout">
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onDelete={handleDelete}
                    onMenuToggle={setOpenMenu}
                    isMenuOpen={openMenu === course.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </PageContainer>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCourseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            isPremium={isPremium}
          />
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}
    </>
  );
}
