/**
 * Layout Component
 * Main authenticated app layout with responsive sidebar navigation and content area.
 * Designed for calm, welcoming student-first experience.
 * 
 * Container layout: Pages should use PageContainer for consistent spacing.
 * This layout provides: header, main, footer structure with sidebar.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';

/**
 * Layout - Authenticated app shell with floating sidebar and responsive navigation
 */
export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFBFC] dark:bg-slate-900">
      {/* Floating Glass Sidebar */}
      <Sidebar />

      {/* Main Content Area - Adjusted for floating sidebar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Main content with consistent vertical padding */}
          <main className="min-h-full flex flex-col pb-28 lg:pb-8 pt-6 lg:pt-8 pl-4 pr-4">
            <div className="flex-1">
              <Outlet />
            </div>
            {/* Footer with consistent container spacing */}
            <div className="max-w-6xl mx-auto px-8 lg:px-16 w-full mt-12">
              <Footer />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
