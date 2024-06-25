// app/layout.tsx
import '@/styles/globals.css';
import { ReactNode } from 'react';
import React from 'react';
import Head from 'next/head';
import Header from '@/components/Header';

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
          <Header />
          {children}
      </body>
    </html>
  );
}
