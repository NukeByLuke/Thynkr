import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BookOpen,
  User,
  Lock,
  Crown,
  Search,
  Filter,
  Globe,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { canBrowsePublicCourses, canAccessCourses } from '@/features/auth/ProtectedRoute';

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

// Locked state for unauthenticated or Basic users
function LockedCoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sample locked courses for display
  const lockedCourses = [
    { title: 'Introduction to Machine Learning', category: 'TECHNOLOGY', creator: 'AI Expert' },
    { title: 'Advanced Calculus', category: 'MATHEMATICS', creator: 'Prof. Math' },
    { title: 'Business Strategy 101', category: 'BUSINESS', creator: 'MBA Coach' },
    { title: 'Spanish for Beginners', category: 'LANGUAGES', creator: 'Language Pro' },
    { title: 'Organic Chemistry', category: 'SCIENCE', creator: 'Dr. Chem' },
    { title: 'Digital Marketing Mastery', category: 'BUSINESS', creator: 'Marketing Guru' },
  ];

  return (
    <>
      <Helmet>
        <title>Courses - Thynkr</title>
        <meta
          name="description"
          content="Browse and study from our collection of courses on Thynkr"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 py-16">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-6xl mx-auto px-8 lg:px-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Unlock the Course Library</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {user
                ? 'Upgrade to Premium to browse public courses created by the community, or upgrade to Standard to create your own private courses.'
                : 'Sign in and upgrade to access our growing library of courses created by experts and the community.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button
                  onClick={() => navigate('/pricing')}
                  className="bg-white text-primary-700 hover:bg-gray-100"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  View Pricing
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-white text-primary-700 hover:bg-gray-100"
                  >
                    Get Started Free
                  </Button>
                  <Button
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Locked Courses Preview */}
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Featured Courses
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              A preview of what's available with Premium
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lockedCourses.map((course, index) => (
              <div
                key={index}
                className="relative group block bg-white dark:bg-gray-800 rounded-2xl shadow-soft overflow-hidden opacity-75"
              >
                {/* Locked Overlay */}
                <div className="absolute inset-0 bg-gray-900/60 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center p-4">
                    <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                    <p className="text-white font-medium">Premium Required</p>
                  </div>
                </div>

                {/* Course Card */}
                <div className="h-40 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white/80" />
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-2">
                    {CATEGORIES.find((c) => c.value === course.category)?.label || 'Other'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {course.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4 mr-1" />
                    <span>{course.creator}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-700 dark:text-primary-300 mb-6">
              <Globe className="h-5 w-5" />
              <span className="font-medium">Browse 100+ public courses with Premium</span>
            </div>
            <div className="max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to start learning?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Standard users can create and manage private courses. Premium users get access to
                the full public course library plus everything in Standard.
              </p>
              <Button onClick={() => navigate('/pricing')} size="lg">
                Upgrade Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Full courses browsing page for Premium/Admin users
function BrowseCoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Use the dedicated public courses endpoint (enforces Premium requirement server-side)
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-courses', { search, category }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      // Use the dedicated public endpoint that requires Premium
      const response = await api.get(`/user-courses/public?${params.toString()}`);
      return response.data;
    },
  });

  const courses: Course[] = data?.courses || [];

  return (
    <>
      <Helmet>
        <title>Browse Courses - Thynkr</title>
        <meta name="description" content="Browse public courses created by the Thynkr community" />
      </Helmet>

      <div className="min-h-screen py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-8 lg:px-16">
          <PageHeader
            icon={<Globe className="h-6 w-6" />}
            title="🌍 Browse Courses"
            description="Explore public courses created by the community"
            actions={
              <Button onClick={() => navigate('/my-courses')}>
                <FolderOpen className="h-5 w-5 mr-2" />
                My Courses
              </Button>
            }
          />

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">Failed to load courses</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No courses found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search || category
                  ? 'Try adjusting your filters'
                  : 'Be the first to create a public course!'}
              </p>
              {!search && !category && (
                <Button onClick={() => navigate('/my-courses')} className="mt-4">
                  Create a Course
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  to={`/my-courses/${course.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-soft hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {course.coverImage ? (
                    <div className="h-44 overflow-hidden">
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-white/80" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                        {CATEGORIES.find((c) => c.value === course.category)?.label || 'Other'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Public
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {course.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{course.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        <span>{course.filesCount} files</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Standard user page - redirect to My Courses
function StandardCoursesPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Courses - Thynkr</title>
        <meta name="description" content="Manage your courses on Thynkr" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
            <FolderOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your Courses</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            As a Standard user, you can create and manage your own private courses. Upgrade to
            Premium to browse public courses from the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/my-courses')} size="lg">
              <FolderOpen className="h-5 w-5 mr-2" />
              Go to My Courses
            </Button>
            <Button onClick={() => navigate('/pricing')} variant="outline" size="lg">
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Main component - routes based on user role
export default function Courses() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Not logged in or Basic user - show locked page
  // Basic/Free users cannot access /courses at all
  if (!user || !canAccessCourses(user.role)) {
    return <LockedCoursesPage />;
  }

  // Standard user - can create private courses, but cannot browse public
  if (!canBrowsePublicCourses(user.role)) {
    return <StandardCoursesPage />;
  }

  // Premium or Admin - full access to browse public courses
  return <BrowseCoursesPage />;
}
