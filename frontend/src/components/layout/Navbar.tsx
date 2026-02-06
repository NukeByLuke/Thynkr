import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  Trophy,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';
import { useState, useMemo, memo } from 'react';

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

const Navbar = memo(() => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Memoize avatar URL to prevent recalculation on every render
  const avatarUrl = useMemo(() => getAvatarUrl(user?.avatarUrl), [user?.avatarUrl]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 sticky top-0 z-50 theme-transition">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Logo - Always visible */}
          <div className="flex items-center flex-shrink-0">
            <Logo variant="full" animated={true} size="md" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/study"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 py-2 rounded-2xl transition-all duration-150 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white dark:text-white drop-shadow-md bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <GraduationCap className="w-4 h-4" />
                  Study
                </NavLink>

                <NavLink
                  to="/courses"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 py-2 rounded-2xl transition-all duration-150 flex items-center gap-1.5 ${
                      isActive || location.pathname.startsWith('/courses/')
                        ? 'text-white dark:text-white drop-shadow-md bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <GraduationCap className="w-4 h-4" />
                  Courses
                </NavLink>

                <NavLink
                  to="/progress"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-4 py-2 rounded-2xl transition-all duration-150 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white dark:text-white drop-shadow-md bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <TrendingUp className="w-4 h-4" />
                  Progress
                </NavLink>
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200/50 dark:border-white/10">
                <ThemeToggle size="sm" />
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border-2 border-white/50 dark:border-slate-700 shadow-sm"
                        key={user.avatarUrl}
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span className="max-w-[100px] truncate">{user?.username || 'Account'}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200/50 dark:border-white/10 py-2 z-[100]">
                      <Link
                        to="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          window.location.href = '/achievements';
                        }}
                        className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Trophy className="w-4 h-4" />
                        Achievements
                      </button>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <div className="my-1 border-t border-slate-200/50 dark:border-white/10" />
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="my-1 border-t border-slate-200/50 dark:border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-200/50 dark:border-white/10">
                <ThemeToggle size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hover:bg-white/50 dark:hover:bg-white/5 rounded-2xl transition-all duration-150"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-xl transition-all duration-150"
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
              className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 p-2.5 rounded-2xl hover:bg-white/5 transition-all duration-150"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/50 dark:border-white/10 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl animate-in slide-in-from-top duration-200">
          <div className="px-3 pt-3 pb-4 space-y-1.5">
            {isAuthenticated && (
              <>
                <Link
                  to="/study"
                  className={`flex items-center px-3 py-2 rounded-xl text-base font-medium transition-all duration-150 ${
                    isActive('/study')
                      ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Study
                </Link>
                <Link
                  to="/courses"
                  className={`flex items-center px-3 py-2 rounded-xl text-base font-medium transition-all duration-150 ${
                    isActive('/courses') || location.pathname.startsWith('/courses/')
                      ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Courses
                </Link>
                <Link
                  to="/progress"
                  className={`flex items-center px-3 py-2 rounded-xl text-base font-medium transition-all duration-150 ${
                    isActive('/progress')
                      ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Progress
                </Link>
              </>
            )}
            
            {isAuthenticated ? (
              <>
                {/* Separator before account section */}
                <div className="my-3 mx-1 border-t border-slate-200/50 dark:border-white/10"></div>

                <Link
                  to="/account"
                  className="flex items-center px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.location.href = '/achievements';
                  }}
                  className="flex items-center w-full text-left px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Achievements
                </button>
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
                
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-3 py-2 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-cyan-400 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-150"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-xl text-base font-medium text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-xl transition-all duration-150"
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
});

Navbar.displayName = 'Navbar';

export default Navbar;

