import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CreditCard,
  CircleHelp,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Courses, Study, Files, Pricing, Admin, Settings as SettingsPage, HelpCenter, Achievements } from '@/routes';
import api from '@/lib/api';

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  component?: { preload: () => Promise<any> };
}

interface SidebarProps {
  forceExpanded?: boolean;
  showCollapseToggle?: boolean;
  onNavigate?: () => void;
  className?: string;
}

const navLinks: NavLink[] = [
  { to: '/study', icon: GraduationCap, label: 'Study', component: Study },
  { to: '/courses', icon: BookOpen, label: 'Courses', component: Courses },
  { to: '/achievements', icon: Trophy, label: 'Achievements', component: Achievements },
  { to: '/files', icon: FolderOpen, label: 'Files', component: Files },
  { to: '/pricing', icon: CreditCard, label: 'Pricing', component: Pricing },
  { to: '/admin', icon: Shield, label: 'Admin', component: Admin, adminOnly: true },
];

const bottomLinks: NavLink[] = [
  { to: '/help', icon: CircleHelp, label: 'Help Center', component: HelpCenter },
  { to: '/settings', icon: Settings, label: 'Settings', component: SettingsPage },
];

const collapsedTooltipClass =
  'absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md pointer-events-none whitespace-nowrap z-[120] opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 shadow-xl';

const Sidebar = ({
  forceExpanded,
  showCollapseToggle = true,
  onNavigate,
  className = '',
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [storedExpanded, setStoredExpanded] = useState(() => {
    const collapsed = localStorage.getItem('thynkr-sidebar-collapsed');
    if (collapsed !== null) return collapsed !== 'true';
    return window.innerWidth >= 1280;
  });
  const [unreadAchievements, setUnreadAchievements] = useState(0);

  const isExpanded = forceExpanded ?? storedExpanded;

  // Fetch unread achievements count
  useEffect(() => {
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

    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (forceExpanded !== undefined) return;
    localStorage.setItem('thynkr-sidebar-collapsed', String(!storedExpanded));
  }, [storedExpanded, forceExpanded]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');
  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Account';
  const userEmail = user?.email || '';

  const NavItem = ({ link, active, badge }: { link: NavLink; active: boolean; badge?: number }) => {
    const Icon = link.icon;

    return (
      <Link
        to={link.to}
        onMouseEnter={() => link.component?.preload()}
        onClick={onNavigate}
        className={`
          relative flex items-center gap-3 rounded-lg group
          ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2 mx-auto aspect-square w-10'}
          ${active
            ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70 border border-transparent'}
        `}
      >
        {active && isExpanded && <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-fuchsia-500 dark:bg-accent-400" />}

        <div className="relative">
          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-fuchsia-600 dark:text-accent-300' : ''}`} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-gradient-to-r from-pink-500 to-orange-500 dark:from-cyan-400 dark:to-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 bg-gradient-to-r from-pink-500 to-orange-500 dark:from-cyan-400 dark:to-blue-500 text-white rounded-full">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
        )}

        {!isExpanded && (
          <div className={collapsedTooltipClass}>
            {link.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`relative z-40 h-full min-h-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col overflow-visible ${className}`}
      style={{ width: isExpanded ? 280 : 80, transition: 'width 140ms ease-out' }}
    >
      {/* Header */}
      <div className={`h-16 px-4 flex-shrink-0 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} border-b border-slate-200/80 dark:border-slate-800/80`}>
        <Link to="/study" className={`flex items-center gap-0.5 overflow-hidden ${!isExpanded ? 'justify-center' : ''}`}>
          <Logo variant="icon" size="xl" className="flex-shrink-0" />
          {isExpanded && (
            <div className="flex flex-col overflow-hidden items-start">
              <img
                src="/brand/wordmark-light.png"
                alt="THYNKR"
                loading="eager"
                fetchPriority="high"
                className="h-6 object-contain dark:hidden"
                style={{ opacity: 1 }}
              />
              <img
                src="/brand/wordmark-dark.png"
                alt="THYNKR"
                loading="eager"
                fetchPriority="high"
                className="h-6 object-contain hidden dark:block"
                style={{ opacity: 1 }}
              />
            </div>
          )}
        </Link>

      </div>

      {isExpanded && (
        <div className="mx-3 mt-3 mb-2 flex-shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`min-h-0 flex-1 px-3 py-5 space-y-1 scrollbar-hide ${isExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
        {isExpanded && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Workspace
          </p>
        )}
        {visibleLinks.map((link) => {
          const isLinkActive = isActive(link.to);
          const badge = link.to === '/achievements' ? unreadAchievements : undefined;
          return <NavItem key={link.to} link={link} active={isLinkActive} badge={badge} />;
        })}
      </nav>

      {/* Upgrade CTA */}
      {!isPremium && isExpanded && (
        <div className="mx-3 mb-2 p-3.5 rounded-lg bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-violet-500/20 dark:to-cyan-500/20 border border-fuchsia-200/70 dark:border-cyan-500/30 relative overflow-hidden group flex-shrink-0">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-16 h-16 transform rotate-12 text-fuchsia-500 dark:text-cyan-300" />
          </div>
          <h3 className="font-semibold text-sm mb-1 relative z-10 text-fuchsia-700 dark:text-cyan-300">Upgrade to Pro</h3>
          <p className="text-[10px] text-fuchsia-600 dark:text-slate-300 mb-2.5 relative z-10 leading-tight">
            Unlock unlimited AI tutoring and advanced analytics.
          </p>
          <Link
            to="/pricing"
            className="block w-full py-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 dark:from-cyan-500 dark:to-violet-500 text-white text-xs font-bold text-center rounded-md relative z-10"
          >
            Get Pro Access
          </Link>
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] space-y-1 border-t border-slate-200/80 dark:border-slate-800/80 pt-4 flex-shrink-0">
        {isExpanded && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Account
          </p>
        )}
        {bottomLinks.map((link) => {
          const isLinkActive = isActive(link.to);
          return <NavItem key={link.to} link={link} active={isLinkActive} />;
        })}

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className={`
            relative flex items-center gap-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 group border border-transparent
            ${isExpanded ? 'w-full px-3 py-2.5' : 'justify-center p-2 mx-auto aspect-square w-10'}
          `}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">Log out</span>
          )}

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className={collapsedTooltipClass}>
              Log out
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      {showCollapseToggle && forceExpanded === undefined && (
        <button
          onClick={() => setStoredExpanded(!storedExpanded)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 z-50 shadow-md"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
