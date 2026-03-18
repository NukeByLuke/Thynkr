import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import ProfileMenu from '@/components/layout/ProfileMenu';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Logo from '@/components/Logo';
import { useLayout } from '@/contexts/LayoutContext';

export default function DashboardLayout() {
  const { hideSidebar, customHeaderContent, hideProfileMenu } = useLayout();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);

  const effectiveHideSidebar = hideSidebar;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    setTabletSidebarOpen(false);
  }, [location.pathname, effectiveHideSidebar]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 || window.innerWidth < 768) {
        setTabletSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-app min-h-app w-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex relative">

      {/* Desktop Sidebar - xl+ only */}
      {!effectiveHideSidebar && (
        <div className="hidden xl:block flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Tablet Sidebar Drawer */}
      <AnimatePresence>
        {!effectiveHideSidebar && tabletSidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="hidden md:block xl:hidden absolute inset-0 z-40 bg-slate-950/35 backdrop-blur-sm"
              onClick={() => setTabletSidebarOpen(false)}
              aria-label="Close navigation drawer"
            />

            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="hidden md:block xl:hidden absolute left-0 top-0 bottom-0 z-50"
            >
              <Sidebar
                forceExpanded
                showCollapseToggle={false}
                onNavigate={() => setTabletSidebarOpen(false)}
                className="h-full shadow-[0_24px_80px_-28px_rgba(15,23,42,0.55)]"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Sticky on all screens */}
        <header className="sticky top-0 pt-safe h-[calc(3.5rem+env(safe-area-inset-top,0px))] bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between px-4 sm:px-5 xl:px-6 relative z-30">
          {/* Left: Mobile menu button + Logo OR custom header content */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!customHeaderContent ? (
              <>
                {!effectiveHideSidebar && (
                  <button
                    type="button"
                    onClick={() => setTabletSidebarOpen(true)}
                    className="hidden md:inline-flex xl:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200"
                    aria-label="Open navigation drawer"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}

                {/* Show logo whenever the persistent desktop sidebar is hidden */}
                <div className="flex items-center gap-2 xl:hidden">
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
          className={`flex-1 overflow-y-auto bg-transparent ${effectiveHideSidebar ? 'p-0 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0' : 'p-3 sm:p-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:px-5 md:py-5 md:pb-5 xl:p-5'}`}
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
