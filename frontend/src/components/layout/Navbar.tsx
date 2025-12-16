import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Menu,
  X,
  User,
  LogOut,
  Shield,
  BookOpen,
  FolderOpen,
  Settings,
  MessageCircle,
  Flame,
  LibraryBig,
  Home,
} from 'lucide-react';
import { useState, useMemo } from 'react';

// Helper to build absolute URLs for avatar images
const getAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  // In dev, let Vite proxy /uploads so external tunnels work without CORS or localhost references
  if (import.meta.env.DEV && avatarUrl.startsWith('/')) return avatarUrl;
  const apiBase = (import.meta.env.VITE_API_URL as string) || '/api';
  const baseUrl = apiBase.replace(/\/api$/, '');
  return `${baseUrl}${avatarUrl}`;
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoize avatar URL to prevent recalculation on every render
  const avatarUrl = useMemo(() => getAvatarUrl(user?.avatarUrl), [user?.avatarUrl]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 sticky top-0 z-50 shadow-soft theme-transition">
      <div className="max-w-6xl mx-auto px-8 lg:px-16">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="full" animated={true} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {!isAuthenticated && (
              <Link
                to="/courses"
                className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center ${
                  isActive('/courses')
                    ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                    : ''
                }`}
              >
                Courses
              </Link>
            )}
            <Link
              to="/"
              className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center ${
                isActive('/')
                  ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                  : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/pricing"
              className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center ${
                isActive('/pricing')
                  ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                  : ''
              }`}
            >
              Pricing
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/files"
                  className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    isActive('/files')
                      ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                      : ''
                  }`}
                >
                  Files
                </Link>
                <Link
                  to="/study"
                  className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                    isActive('/study')
                      ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                      : ''
                  }`}
                >
                  Study
                </Link>
                {(user?.role === 'PREMIUM' || user?.role === 'ADMIN') && (
                  <Link
                    to="/tutor"
                    className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                      isActive('/tutor')
                        ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                        : ''
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    AI Tutor
                  </Link>
                )}
                <Link
                  to="/progress"
                  className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                    isActive('/progress')
                      ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                      : ''
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Progress
                </Link>
                {(user?.role === 'STANDARD' ||
                  user?.role === 'PREMIUM' ||
                  user?.role === 'ADMIN') && (
                  <Link
                    to="/courses"
                    className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                      isActive('/courses') || location.pathname.startsWith('/courses/')
                        ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                        : ''
                    }`}
                  >
                    <LibraryBig className="w-4 h-4" />
                    Courses
                  </Link>
                )}
                {(user?.role === 'STANDARD' ||
                  user?.role === 'PREMIUM' ||
                  user?.role === 'ADMIN') && (
                  <Link
                    to="/saved-packs"
                    className={`text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/5 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                      isActive('/saved-packs')
                        ? 'bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 border-b-2 border-indigo-500'
                        : ''
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Packs
                  </Link>
                )}
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-1 ml-4 pl-4 border-l border-slate-200/50 dark:border-white/10">
                <ThemeToggle size="sm" />
                {user?.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 hover:bg-white/5 rounded-2xl transition-all duration-300"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-1.5 hover:bg-white/5 rounded-2xl transition-all duration-300"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/account')}
                  className="flex items-center gap-2 hover:bg-white/5 rounded-2xl transition-all duration-300"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-7 h-7 rounded-full object-cover border-2 border-white/50 dark:border-slate-700 shadow-sm transition-transform duration-300 hover:scale-110"
                      key={user.avatarUrl} // Force re-render when avatar changes
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="max-w-[100px] truncate">{user?.username || 'Account'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-red-50/80 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 rounded-2xl transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <ThemeToggle size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hover:bg-white/5 rounded-2xl transition-all duration-300"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="rounded-2xl hover:scale-105 transition-all duration-300"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 animate-in slide-in-from-top duration-200">
          <div className="px-3 pt-3 pb-4 space-y-1.5">
            <Link
              to="/courses"
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                isActive('/courses')
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </Link>
            <Link
              to="/pricing"
              className={`block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                isActive('/pricing')
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/files"
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                    isActive('/files')
                      ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Files
                </Link>
                <Link
                  to="/study"
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                    isActive('/study')
                      ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Study
                </Link>
                {(user?.role === 'PREMIUM' || user?.role === 'ADMIN') && (
                  <Link
                    to="/tutor"
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                      isActive('/tutor')
                        ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    AI Tutor
                  </Link>
                )}
                <Link
                  to="/progress"
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                    isActive('/progress')
                      ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Progress
                </Link>
                {(user?.role === 'STANDARD' ||
                  user?.role === 'PREMIUM' ||
                  user?.role === 'ADMIN') && (
                  <Link
                    to="/courses"
                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                      isActive('/courses') || location.pathname.startsWith('/courses/')
                        ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LibraryBig className="w-4 h-4 mr-2" />
                    Courses
                  </Link>
                )}
                <Link
                  to="/"
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1 ${
                    isActive('/')
                      ? 'ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                {/* Separator before account section */}
                <div className="my-3 mx-1 border-t-2 border-gray-300 dark:border-gray-600"></div>

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                )}
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
                <Link
                  to="/account"
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-gray-700 font-semibold transition-all duration-200 hover:shadow-sm hover:translate-x-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

