/**
 * Layout Context
 * Provides communication between pages and the DashboardLayout
 * Used for controlling sidebar visibility and custom header content
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  hideSidebar: boolean;
  setHideSidebar: (hide: boolean) => void;
  customHeaderContent: ReactNode | null;
  setCustomHeaderContent: (content: ReactNode | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [hideSidebar, setHideSidebar] = useState(false);
  const [customHeaderContent, setCustomHeaderContent] = useState<ReactNode | null>(null);

  return (
    <LayoutContext.Provider
      value={{
        hideSidebar,
        setHideSidebar,
        customHeaderContent,
        setCustomHeaderContent,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
