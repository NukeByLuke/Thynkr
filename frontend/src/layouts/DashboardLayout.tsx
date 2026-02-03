import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import ProfileMenu from '@/components/layout/ProfileMenu';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Logo from '@/components/Logo';
import { useLayout } from '@/contexts/LayoutContext';

export default function DashboardLayout() {
  const { hideSidebar, customHeaderContent } = useLayout();

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 bg-grid-pattern flex relative">
      {/* Ambient Glow Orbs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-pink-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-fuchsia-500/10 dark:bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Desktop Sidebar - Hidden on mobile, visible on desktop */}
      {!hideSidebar && (
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Sticky on all screens */}
        <header className="sticky top-0 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between px-4 lg:px-6 relative z-50">
          {/* Left: Mobile menu button + Logo OR custom header content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!customHeaderContent ? (
              <>
                <div className="flex items-center gap-2">
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

        {/* Main Content - Extra bottom padding on mobile for bottom nav */}
        <main className={`flex-1 overflow-y-auto bg-transparent ${hideSidebar ? 'p-0 pb-20 lg:pb-0' : 'p-4 pb-24 lg:p-6 lg:pb-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
