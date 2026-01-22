import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProfileMenu from '@/components/layout/ProfileMenu';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { Menu } from 'lucide-react';
import Logo from '@/components/Logo';
import { useLayout } from '@/contexts/LayoutContext';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hideSidebar, customHeaderContent } = useLayout();

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 bg-grid-pattern flex relative">
      {/* Ambient Glow Orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Desktop Sidebar - Hidden on mobile or when hideSidebar is true */}
      {!hideSidebar && (
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Visible on all screens */}
        <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between px-4 lg:px-6 relative z-50">
          {/* Left: Mobile menu button + Logo OR custom header content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!customHeaderContent ? (
              <>
                {!hideSidebar && (
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </button>
                )}
                <div className="lg:hidden flex items-center gap-2">
                  <Logo variant="icon" animated={false} className="w-7 h-7" />
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    Thynkr
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {customHeaderContent}
              </div>
            )}
          </div>

          {/* Right: Profile Menu */}
          <div className="ml-auto flex-shrink-0">
            <ProfileMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto bg-transparent ${hideSidebar ? 'p-0' : 'p-4 lg:p-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
          />
          {/* Slide-in Sidebar */}
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 transform transition-transform">
            <Sidebar />
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
