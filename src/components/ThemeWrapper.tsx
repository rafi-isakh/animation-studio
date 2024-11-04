'use client';
import { useReader } from '@/contexts/ReaderContext';
import { ReactNode } from 'react';

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { backgroundColor } = useReader();
  
  return (
    <div style={{ backgroundColor, minHeight: '100vh' }}>
      {children}
    </div>
  );
}