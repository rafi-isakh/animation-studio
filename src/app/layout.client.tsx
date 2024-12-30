"use client"
import { DeviceProvider } from '@/contexts/DeviceContext';
import { ThemeProvider } from '@/contexts/providers';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/styles/globals.css';
import { ReactNode, Suspense, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import Header from '@/components/Header';
import { SearchProvider } from '@/contexts/SearchContext';
import Margin from '@/components/Margin';
import { Noto_Sans, Noto_Sans_Thai, Noto_Sans_KR, Noto_Sans_TC, Noto_Sans_JP, Noto_Sans_SC, Noto_Sans_Arabic } from 'next/font/google';
// ... rest of your imports ...

interface RootLayoutProps {
  children: ReactNode;
}

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



export default function RootLayout({ children }: RootLayoutProps) {
    useEffect(() => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }
    }, []);
  
  
    return (
      <html>
        <body>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <UserProvider>
                  <DeviceProvider>
                    <SearchProvider>
                      <div className={`${notoSans.className} ${notoSansKR.className} ${notoSansArabic.className} 
                    ${notoSansThai.className} ${notoSansJP.className} ${notoSansTC.className} ${notoSansSC.className}`}>
                        <Suspense>
                          <Header />
                        </Suspense>
                        <Margin>
                          {children}
                        </Margin>
                        {/* 
                    <div className={`children min-h-screen`}>  
                     // Header bottom margin :: pt-28 md:pt-24 mb-4
                      {children}
                    </div> 
                   */}
                      </div>
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
  