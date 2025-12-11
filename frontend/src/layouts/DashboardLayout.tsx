import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar, { NavigationSection } from '@/components/Sidebar';
import {
  BookOpen,
  FolderOpen,
  MessageCircle,
  Settings,
  LibraryBig,
  TrendingUp,
  Menu,
  X,
  Home,
  DollarSign,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation sections
  const navigationSections: NavigationSection[] = [
    {
      title: 'Workspace',
      items: [
        { path: '/', icon: Home, label: 'Home', end: true },
        { path: '/study', icon: BookOpen, label: 'Study' },
        { path: '/files', icon: FolderOpen, label: 'Files' },
      ],
    },
    {
      title: 'Library',
      items: [
        { path: '/courses', icon: LibraryBig, label: 'Courses' },
        { path: '/progress', icon: TrendingUp, label: 'Progress' },
        ...(user?.role === 'PREMIUM' || user?.role === 'ADMIN'
          ? [{ path: '/tutor', icon: MessageCircle, label: 'AI Tutor' }]
          : []),
      ],
    },
    {
      title: 'Account',
      items: [
        { path: '/settings', icon: Settings, label: 'Settings' },
        { path: '/pricing', icon: DollarSign, label: 'Pricing' },
      ],
    },
  ];

  return (
    // Container: Full screen, no overflow
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617]">
      {/* Layout Grid with padding for floating effect */}
      <div className="flex h-full p-3 gap-3">
        {/* Left Panel (Sidebar Area) - Hidden on mobile */}
        <div className="hidden lg:block w-[280px] flex-shrink-0 h-full">
          <Sidebar sections={navigationSections} />
        </div>

        {/* Right Panel (Main Content) */}
        <div className="flex-1 relative min-w-0">
          <main className="h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-6 left-6 z-50 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-200/60 dark:border-slate-800/50 shadow-lg transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/90"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          />
          {/* Floating Mobile Sidebar */}
          <div className="lg:hidden fixed left-3 top-3 bottom-3 w-[280px] z-50">
            <Sidebar
              sections={navigationSections}
              showCloseButton
              onClose={() => setIsMobileMenuOpen(false)}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
