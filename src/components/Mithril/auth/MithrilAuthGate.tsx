"use client";

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMithrilAuth } from './MithrilAuthContext';

interface MithrilAuthGateProps {
  children: ReactNode;
  redirectTo?: string;
}

const MithrilAuthGate: React.FC<MithrilAuthGateProps> = ({
  children,
  redirectTo = '/mithril/login'
}) => {
  const { isAuthenticated, isLoading } = useMithrilAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default MithrilAuthGate;