import { Bell } from 'lucide-react';
import { useState } from 'react';
import Switch from '@/components/Switch';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [chatMessages, setChatMessages] = useState(false);

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
          Email Notifications
        </h3>

        <div className="space-y-4">
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            label="General Notifications"
            description="Receive updates about your account and new features"
          />

          <Switch
            checked={studyReminders}
            onCheckedChange={setStudyReminders}
            label="Study Reminders"
            description="Get reminders about your study schedule and goals"
          />

          <Switch
            checked={courseUpdates}
            onCheckedChange={setCourseUpdates}
            label="Course Updates"
            description="Notifications about new content in your courses"
          />

          <Switch
            checked={chatMessages}
            onCheckedChange={setChatMessages}
            label="Chat Messages"
            description="Get notified about new messages in your chats"
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Manage browser and mobile notifications
        </p>

        <div className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Push notifications are not enabled yet.
          </p>
          <button className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
            Enable Push Notifications
          </button>
        </div>
      </div>

      {/* Save Changes */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg hover:from-brand-700 hover:to-accent-700 transition-all font-medium">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
