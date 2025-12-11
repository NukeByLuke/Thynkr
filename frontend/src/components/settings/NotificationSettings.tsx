import { Bell, Mail, MessageSquare, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [chatMessages, setChatMessages] = useState(false);

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Notifications
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Choose what updates you want to receive via email
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">General Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Receive updates about your account and new features
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Study Reminders
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get reminders about your study schedule and goals
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={studyReminders}
                onChange={(e) => setStudyReminders(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">Course Updates</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notifications about new content in your courses
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={courseUpdates}
                onChange={(e) => setCourseUpdates(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat Messages
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get notified about new messages in your chats
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={chatMessages}
                onChange={(e) => setChatMessages(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>
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
