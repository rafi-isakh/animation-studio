// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"
import '@/styles/globals.css';
import { Metadata } from 'next'
import { DeviceProvider } from '@/contexts/DeviceContext';
import { ThemeProvider } from '@/contexts/providers';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ReactNode, Suspense, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import Header from '@/components/Header';
import { SearchProvider } from '@/contexts/SearchContext';
import Margin from '@/components/Margin';
import { Noto_Sans_Thai, Noto_Sans_TC, Noto_Sans_Arabic } from 'next/font/google';
import RegisterSW from '@/components/RegisterSW';
import HeaderWrapper from '@/components/HeaderWrapper';
import { NavigationEvents } from '@/components/NewUserNavigation';
import { StripeProvider } from '@/contexts/StripeContext';
import BottomNavigationBar from '@/components/UI/BottomNavigation';
import { Sidebar } from '@/components/UI/Sidebar';

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: '투니즈 Toonyz',
  description: "웹소설, 웹툰 글로벌 스토리 플랫폼, 전세계 이야기가 이곳에",
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://toonyz.com',
    title: '투니즈 Toonyz',
    description: "웹소설, 웹툰 글로벌 스토리 플랫폼",
    images: [
      {
        url: 'https://toonyz.com/_next/image?url=%2Fstelli.png&w=256&q=75',
        alt: '스텔리 Stelli'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '투니즈 toonyz',
    description: '웹소설, 웹툰 글로벌 스토리 플랫폼',
    images: ['https://toonyz.com/_next/image?url=%2Fstelli.png&w=256&q=75'],
  },
  alternates: {
    canonical: 'https://toonyz.com/',
  },
  verification: {
    google: 'mPCV_mpPVichrxpPAZwTfQKLDr3XF5JEPfi-W8kJiLU',
    other: {
      "naver-site-verification": "ab9c8fe45b7e410447296fcf47bbc16bec7d8edf"
    }
  }
}

interface RootLayoutProps {
  children: ReactNode;
}

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: '400'
})
const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai'],
  weight: '400'
})
const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: '400'
})

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className={`antialiased`}>
        <RegisterSW />
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <DeviceProvider>
                  <SearchProvider>
                    <StripeProvider>
                      <div className={`font-pretendard pretendard-jp pretendard-std
                    ${notoSansArabic.className} 
                    ${notoSansThai.className} 
                    ${notoSansTC.className}`}>
                        <Suspense>
                          <Header />
                        </Suspense>
                        <div className="hidden md:block z-[99]">  {/* no sidebar on mobile */}
                          <Sidebar />
                        </div>
                        <div className="md:pl-[72px]">  {/* The side bar width is 72px  md:pl-[72px]  */}
                          {children}
                        </div>
                        <Analytics />
                        <Suspense>
                          <NavigationEvents />
                        </Suspense>
                        {/* 
                    <div className={`children min-h-screen`}>  
                     // Header bottom margin :: pt-28 md:pt-24 mb-4
                  <div className={`${notoSans.className} ${notoSansKR.className} ${notoSansArabic.className} 
                  ${notoSansThai.className} ${notoSansJP.className} ${notoSansTC.className} ${notoSansSC.className}`}>
                    <HeaderWrapper />
                    <Margin>
                      {children}
                    </div> 
                   */}
                        <div className="block md:hidden z-[99]">
                          <BottomNavigationBar />
                        </div>
                      </div>
                    </StripeProvider>
                  </SearchProvider>
                </DeviceProvider>
              </UserProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.6.4/flowbite.min.js" async />
        <script src="https://kit.fontawesome.com/ca5078bbee.js" crossOrigin="anonymous" async></script>
        <script src="https://cdn.iamport.kr/v1/iamport.js" async></script>
      </body>
    </html >
  );
}
