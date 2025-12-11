import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import {
  BookOpen,
  FolderOpen,
  MessageCircle,
  Settings,
  LogOut,
  Clock,
  LibraryBig,
  TrendingUp,
  Menu,
  X,
  Home,
  DollarSign,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const navigationItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/courses', icon: LibraryBig, label: 'Courses' },
    { path: '/files', icon: FolderOpen, label: 'Files' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/pricing', icon: DollarSign, label: 'Pricing' },
    ...(user?.role === 'PREMIUM' || user?.role === 'ADMIN'
      ? [{ path: '/tutor', icon: MessageCircle, label: 'AI Tutor' }]
      : []),
  ];

  const handleLogout = () => {
    logout();
  };

  // Floating Glass Sidebar Content
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl shadow-black/20">
      {/* User Profile Section */}
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'T'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {getGreeting()}, {user?.firstName || user?.username || 'there'}
            </p>
            <p className="text-xs text-slate-400">
              {currentTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-black/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-800/50 space-y-1">
        <NavLink
          to="/settings"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
            <Settings className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-950/30 group"
        >
          <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-red-950/50 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    // Container: Full screen, no overflow
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617]">
      {/* Layout Grid with padding for floating effect */}
      <div className="flex h-full p-3">
        {/* Left Panel (Sidebar Area) - Hidden on mobile */}
        <div className="hidden lg:block w-[280px] flex-shrink-0">
          <SidebarContent />
        </div>

        {/* Right Panel (Main Content) */}
        <div className="flex-1 relative">
          <main className="h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 p-2.5 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-800/50 shadow-lg transition-all duration-200 hover:bg-slate-800/90"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-300" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          />
          {/* Floating Mobile Sidebar */}
          <div className="lg:hidden fixed left-3 top-3 bottom-3 w-[280px] z-50">
            <SidebarContent isMobile />
          </div>
        </>
      )}
    </div>
  );
}
