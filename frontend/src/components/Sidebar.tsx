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
    <aside className="fixed top-0 left-0 h-screen w-20 flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header Section */}
      <div className="flex flex-col items-center pt-6 pb-4">
        {/* Logo */}
        <Logo variant="icon" animated={false} className="h-9 w-9 cursor-pointer" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col items-center py-4 gap-2">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              tabIndex={0}
              aria-label={link.label}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="flex flex-col items-center pb-6">
        {/* Media Controls */}
        <MediaControls />

        {/* Divider */}
        <div className="w-8 h-px bg-gray-200 dark:bg-slate-700 my-3" />

        {/* Control Icons */}
        <div className="flex flex-col items-center gap-2">
          {/* Theme Toggle */}
          <div className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <ThemeToggle />
          </div>

          {/* Settings */}
          <Link
            to="/settings"
            tabIndex={0}
            aria-label="Settings"
            aria-current={isActive('/settings') ? 'page' : undefined}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
              isActive('/settings')
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            tabIndex={0}
            aria-label="Logout"
            className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-500"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
