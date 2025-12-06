import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  FolderOpen,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import MediaControls from './MediaControls';

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navLinks: NavLink[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/study', icon: GraduationCap, label: 'Study' },
  { to: '/tutor', icon: MessageSquare, label: 'AI Tutor' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/library', icon: FolderOpen, label: 'Files' },
  { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 flex flex-col justify-between bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-lg">
      {/* Header Section */}
      <div className="flex flex-col items-center mt-6 gap-6">
        {/* Logo */}
        <Logo variant="icon" animated={false} className="h-10 w-10 cursor-pointer" />

        {/* Divider */}
        <div className="h-[1px] w-10 bg-gradient-to-r from-brand-500/20 to-accent-400/20 my-4" />
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col items-center gap-5">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          return (
            <div key={link.to} className="relative">
              <Link
                to={link.to}
                tabIndex={0}
                aria-label={link.label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-none ${
                  active
                    ? 'text-brand-400 shadow-[0_0_10px_rgba(100,100,255,0.2)]'
                    : 'text-slate-400 hover:text-brand-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center w-full">
        {/* Media Controls */}
        <MediaControls />

        {/* Control Icons */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings */}
          <Link
            to="/settings"
            tabIndex={0}
            aria-label="Settings"
            aria-current={isActive('/settings') ? 'page' : undefined}
            className={`flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-none ${
              isActive('/settings')
                ? 'text-brand-400 shadow-[0_0_10px_rgba(100,100,255,0.2)]'
                : 'text-slate-400 hover:text-brand-400'
            }`}
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            tabIndex={0}
            aria-label="Logout"
            className={`flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-none ${'text-slate-400 hover:text-red-400'}`}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
