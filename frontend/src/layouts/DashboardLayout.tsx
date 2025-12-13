import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar, { NavigationSection } from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import {
  BookOpen,
  FolderOpen,
  MessageCircle,
  Settings,
  LibraryBig,
  TrendingUp,
  Home,
  DollarSign,
  Shield,
  Gamepad2,
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
        { path: '/arcade', icon: Gamepad2, label: 'Arcade' },
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
        ...(user?.role === 'ADMIN'
          ? [{ path: '/admin', icon: Shield, label: 'Admin' }]
          : []),
      ],
    },
  ];

  return (
    // Container: Full screen, no overflow
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#020617] flex flex-col">
      {/* Mobile Header - Only visible on small screens */}
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

      {/* Layout Grid with padding for floating effect */}
      <div className="flex flex-1 p-0 lg:p-3 gap-3 overflow-hidden">
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

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          />
          {/* Floating Mobile Sidebar */}
          <div className="lg:hidden fixed left-3 top-16 bottom-3 w-[280px] z-50">
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
