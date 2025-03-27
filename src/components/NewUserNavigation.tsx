'use client'
 
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext';
import { useCreateMedia } from '@/contexts/CreateMediaContext';

export function NavigationEvents() {
  const prevPathname = useRef('');
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {logout} = useAuth();
  const {setOpenDialog} = useCreateMedia();
 
  useEffect(() => {
    if (prevPathname.current == '/new_user') { // if user logs in and doesn't register, log out
        if (pathname !== '/welcome' && pathname !== '/new_user' && pathname !== '/user_loggedin') {
            logout(false, '/');
        }
    }
    // This obviously isn't new user navigation. probably should rename this file.
    if (pathname !== '/view_webnovels') {
      setOpenDialog(false);
    }
    prevPathname.current = pathname;
  }, [pathname, searchParams])
 
  return null;
}