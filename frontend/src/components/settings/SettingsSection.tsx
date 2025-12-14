import { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
}

export default function SettingsSection({ 
  title, 
  description, 
  children, 
  variant = 'default' 
}: SettingsSectionProps) {
  const bgColor = variant === 'danger' 
    ? 'bg-red-50 dark:bg-red-900/20' 
    : 'bg-white dark:bg-slate-800';
  
  const borderColor = variant === 'danger'
    ? 'border-red-200 dark:border-red-800'
    : 'border-slate-200 dark:border-slate-700';
  
  const titleColor = variant === 'danger'
    ? 'text-red-900 dark:text-red-400'
    : 'text-slate-900 dark:text-white';
  
  const borderBottomColor = variant === 'danger'
    ? 'border-red-200 dark:border-red-800'
    : 'border-slate-100 dark:border-slate-800';

  return (
    <div className={`${bgColor} rounded-xl shadow-sm border ${borderColor} p-6`}>
      <div className={`border-b ${borderBottomColor} pb-2 mb-6`}>
        <h3 className={`text-lg font-medium ${titleColor}`}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
