// app/layout.tsx
import '@/styles/globals.css';
import { ReactNode } from 'react';
import React from 'react';
import Header from '@/components/Header';
import { UserProvider } from '@/contexts/UserContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DeviceProvider } from '@/contexts/DeviceContext';
import { Metadata } from 'next'


interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: 'Toonyz',
}

export default function RootLayout({ children }: RootLayoutProps) {

  return (
    <html>
      <body>
        <LanguageProvider>
          <UserProvider>
            <AuthProvider>
              <DeviceProvider>
                <Header />
                <div className="fixed left-0 right-0 -top-[150vh] h-[200vh] border-l-4 border-r-4 border-black"></div>
                <div className="border-4 border-left-extend min-h-screen border-black border-t-0 rounded pt-32 md:pt-24 md:pl-12 md:pr-12 pl-4 pr-4">
                  {children}
                </div>
              </DeviceProvider>
            </AuthProvider>
          </UserProvider>
        </LanguageProvider>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.4/flowbite.min.js" async />
        <script src="https://kit.fontawesome.com/ca5078bbee.js" crossOrigin="anonymous" async></script>
      </body>
    </html >
  );
}
