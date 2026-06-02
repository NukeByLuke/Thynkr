import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { resolvedThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadAchievements, setUnreadAchievements] = useState(0);

  // Memoize avatar URL to prevent recalculation on every render
  const avatarUrl = useMemo(() => getAvatarUrl(user?.avatarUrl), [user?.avatarUrl]);

  // Theme-aware styling
  const isSunset = resolvedThemeMode === 'sunset';
  const isMidnight = resolvedThemeMode === 'midnight';

  // Navbar background gradient - theme aware
  const navBgClass = `sticky top-0 z-50 bg-gradient-to-b ${
    isMidnight
      ? 'from-slate-950/78 via-slate-950/85 to-black/80 dark:shadow-cyan-900/20'
      : isSunset
      ? 'from-[#051125]/85 via-slate-900/90 to-slate-950/85 dark:shadow-blue-900/20'
      : 'from-pink-50/85 via-fuchsia-50/90 to-orange-50/85'
  } border-b-2 ${
    isMidnight
      ? 'border-cyan-500/25'
      : isSunset
      ? 'border-blue-400/30'
      : 'border-fuchsia-200/80'
  } dark:shadow-lg shadow-sm backdrop-blur-xl transition-all duration-300`;

  // Inactive nav item styling - better contrast per theme
  const inactiveNavClass = `text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
    isMidnight
      ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15'
      : isSunset
      ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 dark:hover:bg-blue-500/15'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
  }`;

  // Active nav item gradient - theme aware
  const activeGradientClass = isMidnight
    ? 'from-cyan-500 via-blue-600 to-violet-600'
    : isSunset
    ? 'from-blue-500 via-violet-600 to-cyan-500'
    : 'from-pink-600 via-pink-500 to-orange-500';

  // Mobile menu item styling - theme aware
  const mobileNavItemClass = (isActive: boolean) => `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
    isActive
      ? `text-white bg-gradient-to-r ${activeGradientClass} shadow-md`
      : isMidnight
      ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
      : isSunset
      ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
  }`;

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
    <nav className={navBgClass}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Low-poly accent line for visual polish */}
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${
          isMidnight
            ? 'from-transparent via-cyan-500/40 to-transparent'
            : isSunset
            ? 'from-transparent via-blue-500/40 to-transparent'
            : 'from-transparent via-fuchsia-300/30 to-transparent'
        }`} />

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
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? `text-white bg-gradient-to-r ${activeGradientClass} shadow-md dark:shadow-lg`
                        : inactiveNavClass
                    }`
                  }
                >
                  <GraduationCap className="w-4 h-4" />
                  Study
                </NavLink>

                <NavLink
                  to="/courses"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive || location.pathname.startsWith('/courses/')
                        ? `text-white bg-gradient-to-r ${activeGradientClass} shadow-md dark:shadow-lg`
                        : inactiveNavClass
                    }`
                  }
                >
                  <BookOpen className="w-4 h-4" />
                  Courses
                </NavLink>

                <NavLink
                  to="/achievements"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap relative ${
                      isActive
                        ? `text-white bg-gradient-to-r ${activeGradientClass} shadow-md dark:shadow-lg`
                        : inactiveNavClass
                    }`
                  }
                >
                  <Trophy className="w-4 h-4" />
                  Achievements
                  {unreadAchievements > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-5 h-5 bg-gradient-to-r ${
                      isMidnight
                        ? 'from-cyan-400 to-blue-500'
                        : isSunset
                        ? 'from-blue-400 to-violet-500'
                        : 'from-pink-600 to-orange-600'
                    } rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md`}>
                      {unreadAchievements > 9 ? '9+' : unreadAchievements}
                    </span>
                  )}
                </NavLink>

                <div className={`w-px h-5 mx-1 ${
                  isMidnight
                    ? 'bg-cyan-500/30'
                    : isSunset
                    ? 'bg-blue-500/40'
                    : 'bg-slate-200'
                }`} />

                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    `text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? `text-white bg-gradient-to-r ${activeGradientClass} shadow-md dark:shadow-lg`
                        : inactiveNavClass
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
                  className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${inactiveNavClass}`}
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${inactiveNavClass}`}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${inactiveNavClass}`}
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className={`w-6 h-6 rounded-full object-cover border-1.5 shadow-sm ${
                          isMidnight
                            ? 'border-cyan-500/50'
                            : isSunset
                            ? 'border-blue-500/50'
                            : 'border-slate-300'
                        }`}
                        key={user.avatarUrl}
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="max-w-[90px] truncate">{user?.username || 'Profile'}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border-1.5 py-1 z-[100] backdrop-blur-sm transition-all duration-200 ${
                      isMidnight
                        ? 'bg-slate-900/95 dark:shadow-cyan-900/40 border-cyan-500/30'
                        : isSunset
                        ? 'bg-slate-800/95 dark:shadow-blue-900/40 border-blue-500/30'
                        : 'bg-white dark:shadow-2xl dark:shadow-black/60 border-slate-200/80 dark:border-slate-700/80'
                    }`}>
                      <Link
                        to="/account"
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                          isMidnight
                            ? 'text-slate-200 hover:bg-cyan-500/15'
                            : isSunset
                            ? 'text-slate-300 hover:bg-blue-500/15'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        to="/achievements"
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                          isMidnight
                            ? 'text-slate-200 hover:bg-cyan-500/15'
                            : isSunset
                            ? 'text-slate-300 hover:bg-blue-500/15'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Achievements</span>
                        {unreadAchievements > 0 && (
                          <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full text-white ${
                            isMidnight
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                              : isSunset
                              ? 'bg-gradient-to-r from-blue-500 to-violet-500'
                              : 'bg-gradient-to-r from-pink-500 to-orange-500'
                          }`}>
                            {unreadAchievements > 9 ? '9+' : unreadAchievements}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/settings"
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                          isMidnight
                            ? 'text-slate-200 hover:bg-cyan-500/15'
                            : isSunset
                            ? 'text-slate-300 hover:bg-blue-500/15'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <div className={`my-1 border-t ${
                            isMidnight
                              ? 'border-cyan-500/20'
                              : isSunset
                              ? 'border-blue-500/20'
                              : 'border-slate-200/50'
                          }`} />
                          <Link
                            to="/admin"
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors duration-200 ${
                              isMidnight
                                ? 'text-slate-200 hover:bg-cyan-500/15'
                                : isSunset
                                ? 'text-slate-300 hover:bg-blue-500/15'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className={`my-1 border-t ${
                        isMidnight
                          ? 'border-cyan-500/20'
                          : isSunset
                          ? 'border-blue-500/20'
                          : 'border-slate-200/50'
                      }`} />
                      <button
                        onClick={handleLogout}
                        className={`flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 ${
                          isMidnight
                            ? 'text-red-400 hover:bg-red-500/15'
                            : isSunset
                            ? 'text-red-400 hover:bg-red-500/15'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
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
                  className={`hidden sm:flex rounded-lg transition-all duration-200 ${
                    isMidnight
                      ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                      : isSunset
                      ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className={`rounded-lg bg-gradient-to-r ${activeGradientClass} hover:shadow-lg transition-all`}
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
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                isMidnight
                  ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                  : isSunset
                  ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={`border-t animate-in slide-in-from-top duration-200 ${
          isMidnight
            ? 'border-cyan-500/20 bg-gradient-to-b from-slate-900 to-slate-950'
            : isSunset
            ? 'border-blue-500/25 bg-gradient-to-b from-slate-900 to-slate-950'
            : 'border-slate-200/60 bg-gradient-to-b from-slate-50 to-white'
        }`}>
          <div className="px-3 pt-3 pb-4 space-y-1.5 max-w-md">
            {isAuthenticated ? (
              <>
                {/* Navigation Section */}
                <div className="space-y-1">
                  <Link
                    to="/study"
                    className={mobileNavItemClass(isActive('/study'))}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <GraduationCap className="w-4 h-4 mr-2.5" />
                    Study
                  </Link>
                  <Link
                    to="/courses"
                    className={mobileNavItemClass(isActive('/courses') || location.pathname.startsWith('/courses/'))}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-4 h-4 mr-2.5" />
                    Courses
                  </Link>
                  <Link
                    to="/achievements"
                    className={`${mobileNavItemClass(isActive('/achievements'))} relative`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Trophy className="w-4 h-4 mr-2.5" />
                    Achievements
                    {unreadAchievements > 0 && (
                      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                        isMidnight
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                          : isSunset
                          ? 'bg-gradient-to-r from-blue-400 to-violet-500'
                          : 'bg-gradient-to-r from-pink-600 to-orange-600'
                      }`}>
                        {unreadAchievements > 9 ? '9+' : unreadAchievements}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/pricing"
                    className={mobileNavItemClass(isActive('/pricing'))}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CircleDollarSign className="w-4 h-4 mr-2.5" />
                    Pricing
                  </Link>
                </div>
                
                {/* Account Section */}
                <div className={`pt-2 border-t ${
                  isMidnight
                    ? 'border-cyan-500/20'
                    : isSunset
                    ? 'border-blue-500/25'
                    : 'border-slate-200/60'
                }`}>
                  <Link
                    to="/account"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2.5" />
                    My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2.5" />
                    Settings
                  </Link>
                  
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isMidnight
                          ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                          : isSunset
                          ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4 mr-2.5" />
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-red-400 hover:bg-red-500/15'
                        : isSunset
                        ? 'text-red-400 hover:bg-red-500/15'
                        : 'text-red-600 hover:bg-red-50/80'
                    }`}
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
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>
                </div>

                {/* Auth Buttons */}
                <div className={`pt-2 border-t space-y-1 ${
                  isMidnight
                    ? 'border-cyan-500/20'
                    : isSunset
                    ? 'border-blue-500/25'
                    : 'border-slate-200/60'
                }`}>
                  <Link
                    to="/login"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isMidnight
                        ? 'text-slate-300 hover:text-cyan-200 hover:bg-cyan-500/10'
                        : isSunset
                        ? 'text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${activeGradientClass} hover:shadow-lg transition-all`}
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

