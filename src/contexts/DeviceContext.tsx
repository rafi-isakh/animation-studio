"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useMediaQuery } from 'react-responsive';

type DeviceContextType = 'mobile' | 'desktop';

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const device = isMobile ? 'mobile' : 'desktop';

  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
