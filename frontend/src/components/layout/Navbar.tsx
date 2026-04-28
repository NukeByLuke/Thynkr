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
  CircleDollarSign,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useState, useMemo, memo, useEffect } from 'react';
import api from '@/lib/api';

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
  const [unreadAchievements, setUnreadAchievements] = useState(0);

  // Memoize avatar URL to prevent recalculation on every render
  const avatarUrl = useMemo(() => getAvatarUrl(user?.avatarUrl), [user?.avatarUrl]);

  // Fetch unread achievements count
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get('/progress/achievements');
        if (Array.isArray(data)) {
          const unread = data.filter((a: any) => a.unlockedAt && !a.viewedAt).length;
          setUnreadAchievements(unread);
        }
      } catch (error) {
        // Silently fail - achievements count is not critical
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 shadow-sm dark:shadow-lg dark:shadow-black/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 gap-4">
          {/* Logo - Always visible */}
          <div className="flex items-center flex-shrink-0">
            <Logo variant="full" animated={true} size="md" />
          </div>

          {/* Desktop Navigation - Centered, organized */}
          <div className="hidden md:flex items-center gap-0.5">
            {isAuthenticated ? (
              <>
                {/* Main Navigation */}
                <NavLink
                  to="/study"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md dark:shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <GraduationCap className="w-4 h-4" />
                  Study
                </NavLink>

                <NavLink
                  to="/courses"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive || location.pathname.startsWith('/courses/')
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md dark:shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <BookOpen className="w-4 h-4" />
                  Courses
                </NavLink>

                <NavLink
                  to="/achievements"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap relative ${
                      isActive
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md dark:shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Trophy className="w-4 h-4" />
                  Achievements
                  {unreadAchievements > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-gradient-to-r from-pink-600 to-orange-600 dark:from-cyan-500 dark:to-blue-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                      {unreadAchievements > 9 ? '9+' : unreadAchievements}
                    </span>
                  )}
                </NavLink>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-1"></div>

                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md dark:shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <CircleDollarSign className="w-4 h-4" />
                  Pricing
                </NavLink>
              </>
            ) : (
              <>
                {/* Public Navigation */}
                <Link
                  to="/pricing"
                  className="text-sm font-medium px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="text-sm font-medium px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium px-3.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                >
                  Contact
                </Link>
              </>
            )}
          </div>

          {/* Right Section - Theme toggle + Profile */}
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle size="sm" />
            
            {isAuthenticated ? (
              <>
                {/* Desktop Profile Menu */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-6 h-6 rounded-full object-cover border-1.5 border-slate-300 dark:border-slate-600 shadow-sm"
                        key={user.avatarUrl}
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="max-w-[90px] truncate">{user?.username || 'Profile'}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-2xl dark:shadow-black/60 border border-slate-200/80 dark:border-slate-700/80 py-1 z-[100] backdrop-blur-sm">
                      <Link
                        to="/account"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/achievements"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors relative group"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Achievements</span>
                        {unreadAchievements > 0 && (
                          <span className="ml-auto text-xs font-bold px-2 py-1 bg-gradient-to-r from-pink-500 to-orange-500 dark:from-cyan-400 dark:to-blue-500 text-white rounded-full">
                            {unreadAchievements > 9 ? '9+' : unreadAchievements}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <div className="my-1 border-t border-slate-200/50 dark:border-slate-700/50" />
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="my-1 border-t border-slate-200/50 dark:border-slate-700/50" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Auth Buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-lg"
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-lg transition-all"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/60 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 animate-in slide-in-from-top duration-200">
          <div className="px-3 pt-3 pb-4 space-y-1.5 max-w-md">
            {isAuthenticated ? (
              <>
                {/* Navigation Section */}
                <div className="space-y-1">
                  <Link
                    to="/study"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive('/study')
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4 mr-2.5" />
                    Study
                  </Link>
                  <Link
                    to="/courses"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive('/courses') || location.pathname.startsWith('/courses/')
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-4 h-4 mr-2.5" />
                    Courses
                  </Link>
                  <Link
                    to="/achievements"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                      isActive('/achievements')
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Trophy className="w-4 h-4 mr-2.5" />
                    Achievements
                    {unreadAchievements > 0 && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-gradient-to-r from-pink-600 to-orange-600 dark:from-cyan-500 dark:to-blue-600 text-white rounded-full">
                        {unreadAchievements > 9 ? '9+' : unreadAchievements}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/pricing"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive('/pricing')
                        ? 'text-white dark:text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 shadow-md'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CircleDollarSign className="w-4 h-4 mr-2.5" />
                    Pricing
                  </Link>
                </div>
                
                {/* Account Section */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/80">
                  <Link
                    to="/account"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2.5" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2.5" />
                    Settings
                  </Link>
                  
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4 mr-2.5" />
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-all"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Public Navigation */}
                <div className="space-y-1">
                  <Link
                    to="/pricing"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>

                {/* Auth Buttons */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/80 space-y-1">
                  <Link
                    to="/login"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 hover:shadow-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
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

