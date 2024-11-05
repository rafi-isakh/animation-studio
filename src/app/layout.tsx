// app/layout.tsx
import '@/styles/globals.css';
import { ReactNode, Suspense } from 'react';
import React from 'react';
import Header from '@/components/Header';
import { UserProvider } from '@/contexts/UserContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DeviceProvider } from '@/contexts/DeviceContext';
import { Metadata } from 'next'
import { Noto_Sans, Noto_Sans_KR, Noto_Sans_Arabic, Noto_Sans_Thai, Noto_Sans_JP, Noto_Sans_TC, Noto_Sans_SC } from 'next/font/google'
import Margin from '@/components/Margin';


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
  title: '투니즈 Toonyz',
  description: "웹소설, 웹툰 글로벌 스토리 플랫폼, 전세계 이야기가 이곳에",
  openGraph: {
    type: 'website',
    url: 'https://toonyz.com',
    title: '투니즈 Toonyz',
    description: "웹소설, 웹툰 글로벌 스토리 플랫폼",
    images: [
      {
        url: 'https://toonyz.com/_next/image?url=%2FtoonyzLogo.png',
        width: 250,
        alt: '투니즈 Toonyz Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '투니즈 toonyz',
    description: '웹소설, 웹툰 글로벌 스토리 플랫폼',
    images: ['https://toonyz.com/_next/image?url=%2FtoonyzLogo.png&w=256&q=75'],
  },
  alternates: {
    canonical: 'https://toonyz.com/',
  },
  verification: {
    google: 'mPCV_mpPVichrxpPAZwTfQKLDr3XF5JEPfi-W8kJiLU',
    naver: 'ab9c8fe45b7e410447296fcf47bbc16bec7d8edf',
  } as { google?: string; naver?: string }
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
                  <Suspense >
                    <Header />
                  </Suspense>
                  <Margin/>
                  <div className={`children min-h-screen pt-28 md:pt-24 mb-4`}>
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
