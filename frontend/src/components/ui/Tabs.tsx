/**
 * Tabs Component
 * Thea-inspired tabs with rounded top, active underline indicator, and smooth transitions.
 */

import { ReactNode, createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Tabs - Container for tab navigation
 */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const activeTab = value ?? internalValue;
  const setActiveTab = (tab: string) => {
    setInternalValue(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'underline' | 'pills' | 'enclosed';
}

/**
 * TabsList - Container for tab triggers
 */
export function TabsList({ children, className, variant = 'underline' }: TabsListProps) {
  const variantClasses = {
    underline: 'border-b border-gray-200 dark:border-slate-700',
    pills: 'bg-gray-100 dark:bg-slate-800 p-1 rounded-xl',
    enclosed: 'bg-gray-50 dark:bg-slate-900 rounded-t-xl',
  };

  return (
    <div
      className={clsx(
        'flex gap-1',
        variantClasses[variant],
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * TabsTrigger - Individual tab button
 */
export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={clsx(
        'relative px-4 py-2.5',
        'text-sm font-medium',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        'rounded-t-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        isActive
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

/**
 * TabsContent - Content panel for each tab
 */
export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <motion.div
      id={`tabpanel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={clsx('pt-4', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Standalone Tabs component for simpler use cases
 */
interface SimpleTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
  }>;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'enclosed';
}

export function SimpleTabs({
  tabs,
  defaultTab,
  onTabChange,
  className,
  variant = 'underline',
}: SimpleTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab || tabs[0]?.id || ''}
      onValueChange={onTabChange}
      className={className}
    >
      <TabsList variant={variant}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default Tabs;
