/**
 * Layout Component
 * Main authenticated app layout with responsive sidebar navigation and content area.
 */

import { Outlet } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { motion } from 'framer-motion';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNavNew from './MobileBottomNavNew';
import Footer from './Footer';

/**
 * Layout - Authenticated app shell with sidebar and responsive navigation
 */
export default function Layout() {
  const { isSidebarOpen } = useNavigation();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
          <main className="min-h-full flex flex-col pb-28 lg:pb-0 px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex-1">
              <Outlet />
            </div>
            <Footer />
          </main>
        </div>
      </motion.div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavNew />
    </div>
  );
}
