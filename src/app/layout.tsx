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
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { Noto_Sans, Noto_Sans_KR, Noto_Sans_Arabic, Noto_Sans_Thai, Noto_Sans_JP, Noto_Sans_TC, Noto_Sans_SC } from 'next/font/google'


const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'devanagari'],
  weight: '400'
})
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: '400'
})
const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: '400'
})
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: '400'
})
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: '400'
})
const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: '400'
})
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: '400'
})


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
          <AuthProvider>
            <UserProvider>
              <DeviceProvider>
                <div className={`${notoSans.className} ${notoSansKR.className} ${notoSansArabic.className} 
                  ${notoSansThai.className} ${notoSansJP.className} ${notoSansTC.className} ${notoSansSC.className}`}>
                  <Header />
                  <div className={`children min-h-screen pt-24 md:pt-32`}>
                    {children}
                  </div>
                </div>
              </DeviceProvider>
            </UserProvider>
          </AuthProvider>
        </LanguageProvider>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.4/flowbite.min.js" async />
        <script src="https://kit.fontawesome.com/ca5078bbee.js" crossOrigin="anonymous" async></script>
      </body>
    </html >
  );
}
