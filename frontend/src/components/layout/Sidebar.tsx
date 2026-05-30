import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Moon,
  Sun,
  Sunset,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from '@/components/Logo';
import { Courses, Study, Files, Pricing, Admin, HelpCenter, Achievements } from '@/routes';

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

const workspaceLinks: NavLink[] = [
  { to: '/study', icon: GraduationCap, label: 'Study', component: Study },
  { to: '/courses', icon: BookOpen, label: 'Courses', component: Courses },
  { to: '/achievements', icon: Trophy, label: 'Achievements', component: Achievements },
  { to: '/files', icon: FolderOpen, label: 'Files', component: Files },
];

const footerLinks: NavLink[] = [
  { to: '/pricing', icon: CreditCard, label: 'Pricing', component: Pricing },
  { to: '/help', icon: CircleHelp, label: 'Help Center', component: HelpCenter },
];

const adminLink: NavLink = { to: '/admin', icon: Shield, label: 'Admin', component: Admin, adminOnly: true };

const collapsedTooltipClass =
  'absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md pointer-events-none whitespace-nowrap z-[120] opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 shadow-xl';

const Sidebar = ({
  forceExpanded,
  showCollapseToggle = true,
  onNavigate,
  className = '',
}: SidebarProps) => {
  const { user, logout } = useAuth();
  const { resolvedThemeMode, setThemeMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [storedExpanded, setStoredExpanded] = useState(() => {
    const collapsed = localStorage.getItem('thynkr-sidebar-collapsed');
    if (collapsed !== null) return collapsed !== 'true';
    return window.innerWidth >= 1280;
  });
  const isExpanded = forceExpanded ?? storedExpanded;



  useEffect(() => {
    if (forceExpanded !== undefined) return;
    localStorage.setItem('thynkr-sidebar-collapsed', String(!storedExpanded));
  }, [storedExpanded, forceExpanded]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';
  const userDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Account';
  const userEmail = user?.email || '';
  const ThemeIcon = resolvedThemeMode === 'sunrise' ? Sun : resolvedThemeMode === 'sunset' ? Sunset : Moon;
  const themeActionLabel =
    resolvedThemeMode === 'sunrise' ? 'Light mode' : resolvedThemeMode === 'sunset' ? 'Dark mode' : 'Midnight mode';

  const cycleThemeMode = () => {
    setThemeMode(resolvedThemeMode === 'sunrise' ? 'sunset' : 'sunrise');
  };

  const NavItem = ({ link, active, badge }: { link: NavLink; active: boolean; badge?: number }) => {
    const Icon = link.icon;
    const isMidnight = resolvedThemeMode === 'midnight';

    return (
      <Link
        to={link.to}
        onMouseEnter={() => link.component?.preload()}
        onClick={onNavigate}
        className={`
          relative flex items-center gap-3 rounded-lg group transition-all duration-150
          ${isExpanded ? 'px-3 py-2.5' : 'justify-center p-2 mx-auto aspect-square w-10'}
          ${active
            ? `text-slate-900 ${isMidnight ? 'dark:text-white dark:bg-slate-800 dark:border-slate-700' : 'dark:text-white'} bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm`
            : `text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-slate-800/70 border border-transparent ${isMidnight ? 'dark:hover:bg-slate-800' : ''}`}
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
      className={`relative z-40 h-full min-h-0 bg-gradient-to-b from-fuchsia-50/80 via-white to-orange-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 backdrop-blur-xl border-r border-fuchsia-200/70 dark:border-slate-800/80 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.7)] flex flex-col overflow-visible transition-colors duration-200 ${className}`}
      style={{ 
        width: isExpanded ? 280 : 80, 
        transition: 'width 140ms ease-out',
        // Midnight theme specific styling
        backgroundColor: document.documentElement.getAttribute('data-theme') === 'midnight' 
          ? '#0f0f1e' 
          : undefined,
      }}
      data-theme={resolvedThemeMode}
    >
      {/* Header */}
      <div className={`h-16 px-4 flex-shrink-0 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} border-b border-fuchsia-200/70 dark:border-slate-800/80 bg-white/45 dark:bg-slate-950/35`}>
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
        <div className="mx-3 mt-3 mb-2 flex-shrink-0 rounded-xl border border-fuchsia-200/70 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-3 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-600 dark:text-cyan-300 mb-1">Workspace</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`min-h-0 flex-1 px-3 py-4 space-y-4 ${isExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}>
        <div className="space-y-1.5">
          {isExpanded && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Workspace
            </p>
          )}
          {workspaceLinks.map((link) => {
            const isLinkActive = isActive(link.to);
            return <NavItem key={link.to} link={link} active={isLinkActive} />;
          })}
        </div>

        {user?.role === 'ADMIN' && (
          <div className="space-y-1.5 pt-2 border-t border-fuchsia-200/70 dark:border-slate-800/80">
            {isExpanded && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Admin
              </p>
            )}
            <NavItem link={adminLink} active={isActive('/admin')} />
          </div>
        )}

      </nav>

      {/* Premium Upsell */}
      {isExpanded && !isPremium && (
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/12 via-white to-orange-500/12 dark:from-cyan-500/15 dark:via-slate-900 dark:to-violet-500/15 border border-fuchsia-200/70 dark:border-cyan-500/25 p-3.5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-500 dark:from-cyan-400 dark:to-violet-500 p-2 text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm text-fuchsia-800 dark:text-cyan-200">Upgrade to Premium</h3>
                <p className="mt-1 text-xs leading-snug text-slate-600 dark:text-slate-300">
                  Unlock unlimited AI tutoring and advanced analytics.
                </p>
                <Link
                  to="/pricing"
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-500 dark:via-blue-600 dark:to-violet-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                >
                  Get Premium Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 flex-shrink-0 bg-white/35 dark:bg-slate-950/25 border-t border-fuchsia-200/70 dark:border-slate-800/80">
        <div className="mb-3 space-y-1.5">
          {footerLinks.map((link) => {
            const isLinkActive = isActive(link.to);
            return <NavItem key={link.to} link={link} active={isLinkActive} />;
          })}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/80 px-2.5 py-2 shadow-sm">
          <button
            type="button"
            onClick={cycleThemeMode}
            aria-label={themeActionLabel}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all border ${
              resolvedThemeMode === 'sunrise'
                ? 'bg-amber-500/15 border-amber-200 text-amber-600 dark:bg-amber-400/15 dark:border-amber-400/30 dark:text-amber-300'
                : resolvedThemeMode === 'sunset'
                ? 'bg-cyan-500/15 border-cyan-200 text-cyan-600 dark:bg-cyan-400/15 dark:border-cyan-400/30 dark:text-cyan-300'
                : 'bg-violet-500/15 border-violet-200 text-violet-600 dark:bg-violet-400/15 dark:border-violet-400/30 dark:text-violet-300'
            }`}
          >
            <ThemeIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('/settings');
              onNavigate?.();
            }}
            aria-label="Settings"
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all border ${
              isActive('/settings')
                ? 'bg-fuchsia-500/15 border-fuchsia-200 text-fuchsia-600 dark:bg-cyan-400/15 dark:border-cyan-400/30 dark:text-cyan-300'
                : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onNavigate?.();
            }}
            aria-label="Log out"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all border border-transparent text-slate-500 dark:text-slate-400 hover:bg-red-50/90 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
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
