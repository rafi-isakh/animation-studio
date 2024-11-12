'use client';

import { useReader } from '@/contexts/ReaderContext';
import { useTheme } from '@/contexts/providers';
import { ReactNode } from 'react';

interface ThemeWrapperProps {
  children: ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { backgroundColor } = useReader();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`
      min-h-screen 
      w-full
      transition-colors 
      duration-200
      text-gray-900 dark:text-white
      ${backgroundColor !== 'bg-transparent' ? backgroundColor : '' }`}>
        {children}
    </div>
  );
}