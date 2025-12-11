/**
 * MobileHeader Component
 * A responsive header for mobile screens with hamburger menu and user avatar
 */

import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user } = useAuth();

  const getUserInitial = () => {
    return user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20">
            T
          </div>
          <span className="text-base font-semibold text-slate-900 dark:text-white">
            Thynkr
          </span>
        </div>

        {/* Right: User Avatar */}
        <button
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm hover:ring-2 hover:ring-blue-500/30 transition-all"
          aria-label="User profile"
        >
          {getUserInitial()}
        </button>
      </div>
    </header>
  );
}
