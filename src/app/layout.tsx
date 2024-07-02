// app/layout.tsx
import '@/styles/globals.css';
import { ReactNode } from 'react';
import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import { AuthProvider } from '@/components/AuthContext';

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
          <AuthProvider>
            <Header />
            <br/>
            {children}
          </AuthProvider>
          <script src="/backend/flowbite/flowbite.min.js"/>
      </body>
    </html>
  );
}
