// app/layout.tsx
import '@/styles/globals.css';
import { ReactNode } from 'react';
import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { UserProvider } from '@/contexts/UserContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {

  return (
    <html>
      <Head>
        <title>Stelland Web Novel Platform</title>
      </Head>
      <body>
        <LanguageProvider>
          <UserProvider>
            <AuthProvider>
              <Header />
              <div className="pt-32 md:pt-24 md:pl-12 md:pr-12 pl-4 pr-4">
                {children}
              </div>
            </AuthProvider>
          </UserProvider>
        </LanguageProvider>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.4/flowbite.min.js" async />
        <script src="https://kit.fontawesome.com/ca5078bbee.js" crossOrigin="anonymous" async></script>
      </body>
    </html >
  );
}
