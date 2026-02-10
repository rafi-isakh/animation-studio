"use client";

import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMithrilAuth } from './MithrilAuthContext';

interface AdminAuthGateProps {
  children: ReactNode;
  redirectTo?: string;
}

const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  children,
  redirectTo = '/mithril'
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useMithrilAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, isAdmin, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuthGate;
