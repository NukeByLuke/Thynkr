import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProfileMenu from '@/components/layout/ProfileMenu';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Logo from '@/components/Logo';
import { useLayout } from '@/contexts/LayoutContext';

export default function DashboardLayout() {
  const { hideSidebar, customHeaderContent, hideProfileMenu } = useLayout();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  const effectiveHideSidebar = hideSidebar;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="h-app min-h-app w-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex relative">
      
      {/* Desktop Sidebar - Hidden on mobile, visible on desktop */}
      {!effectiveHideSidebar && (
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Sticky on all screens */}
        <header className="sticky top-0 pt-safe h-[calc(3.5rem+env(safe-area-inset-top,0px))] bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between px-4 lg:px-6 relative z-50">
          {/* Left: Mobile menu button + Logo OR custom header content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!customHeaderContent ? (
              <>
                {/* Only show logo in header on mobile (sidebar hidden) */}
                <div className="flex items-center gap-2 lg:hidden">
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

          {/* Right: Profile Menu (hidden in study mode) */}
          {!hideProfileMenu && (
            <div className="ml-auto flex-shrink-0">
              <ProfileMenu />
            </div>
          )}
        </header>

        {/* Main Content - Extra bottom padding on mobile for bottom nav */}
        <main
          ref={mainRef}
          className={`flex-1 overflow-y-auto bg-transparent ${effectiveHideSidebar ? 'p-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : 'p-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:p-5 lg:pb-5'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
