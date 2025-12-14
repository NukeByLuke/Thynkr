/**
 * Layout Component
 * Main authenticated app layout with responsive sidebar navigation and content area.
 * Designed for calm, welcoming student-first experience.
 * 
 * Container layout: Pages should use PageContainer for consistent spacing.
 * This layout provides: header, main, footer structure with sidebar.
 */

import { Outlet } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { motion } from 'framer-motion';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNavNew from './MobileBottomNavNew';
import Footer from './Footer';

/**
 * Layout - Authenticated app shell with sidebar and responsive navigation
 */
export default function Layout() {
  const { isSidebarOpen } = useNavigation();
  const { isPlaying, text } = usePlayerStore();
  
  // Check if player is active
  const isPlayerActive = isPlaying || text;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFC] dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft:
            typeof window !== 'undefined' && window.innerWidth >= 1024
              ? isSidebarOpen
                ? 256
                : 80
              : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Main content with consistent vertical padding - Add extra padding when player is active */}
          <main className={`min-h-full flex flex-col pb-28 lg:pb-8 pt-6 lg:pt-8 ${isPlayerActive ? 'pb-24' : ''}`}>
            <div className="flex-1">
              <Outlet />
            </div>
            {/* Footer with consistent container spacing */}
            <div className="max-w-6xl mx-auto px-8 lg:px-16 w-full mt-12">
              <Footer />
            </div>
          </main>
        </div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavNew />
    </div>
  );
}
