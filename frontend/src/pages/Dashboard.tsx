/**
 * Dashboard Page
 * Main authenticated home page with hero section, quick actions, and recent activity
 */

import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHero from '@/components/dashboard/DashboardHero';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Fetch user stats from API
  // For now, using placeholder values
  const userStats = {
    currentStreak: 5,
    currentXP: 750,
    nextLevelXP: 1000,
    currentLevel: 3,
  };

  const handleUploadClick = () => {
    // Navigate to Study page which has the full upload functionality
    navigate('/study');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Grid pattern background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <DashboardHero
          userName={user?.username || 'Student'}
          currentStreak={userStats.currentStreak}
          currentXP={userStats.currentXP}
          nextLevelXP={userStats.nextLevelXP}
          currentLevel={userStats.currentLevel}
        />

        {/* Quick Actions */}
        <QuickActions onUploadClick={handleUploadClick} />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Hidden file input for upload functionality */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.pps,.ppsx"
          multiple
        />
      </div>
    </div>
  );
}
