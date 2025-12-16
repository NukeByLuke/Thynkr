import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Award,
  FolderOpen,
  Shield,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

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
  { to: '/achievements', icon: Award, label: 'Achievements' },
  { to: '/library', icon: FolderOpen, label: 'Files' },
  { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
];

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-900/80 backdrop-blur-md border-r border-white/5">
      {/* Logo Section */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo variant="icon" animated={false} className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
              Thynkr
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              AI Study Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Premium Badge (if user has premium) */}
      {(user?.role === 'PREMIUM' || user?.role === 'ADMIN') && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Premium Member
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);

            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative
                    ${
                      active
                        ? 'bg-indigo-500/20 text-indigo-300 font-medium border-l-2 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'text-slate-300 hover:bg-white/5'
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-sm">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-slate-500 text-center">
          © 2024 Thynkr. All rights reserved.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
