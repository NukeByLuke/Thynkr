import { Bell } from 'lucide-react';
import { useState } from 'react';
import Switch from '@/components/Switch';
import Button from '@/components/ui/Button';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [chatMessages, setChatMessages] = useState(false);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Email Notifications</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Choose what you want to receive via email.
        </p>

        <div className="space-y-6 max-w-2xl">
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
      </section>

      <hr className="border-slate-200 dark:border-white/10" />

      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Push Notifications</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Get notified directly on your device.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
               <Bell className="w-6 h-6" />
             </div>
             <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">Enable Browser Notifications</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
                Stay updated even when you're not on the platform.
             </p>
             <Button>
                Use Push Notifications
            </Button>
        </div>
      </section>
      
      <div className="flex justify-end pt-4">
        <Button size="lg"> Save Preferences </Button>
      </div>
    </div>
  );
}
