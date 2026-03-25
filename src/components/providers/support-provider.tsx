
'use client';

import React, { createContext, useContext, useState } from 'react';

interface SupportContextType {
  isSupportOpen: boolean;
  setSupportOpen: (open: boolean) => void;
  toggleSupport: () => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: React.ReactNode }) {
  const [isSupportOpen, setSupportOpen] = useState(false);

  const toggleSupport = () => setSupportOpen((prev) => !prev);

  return (
    <SupportContext.Provider value={{ isSupportOpen, setSupportOpen, toggleSupport }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (context === undefined) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
}
