// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"
import '@/styles/globals.css';
import { Metadata } from 'next'
import { DeviceProvider } from '@/contexts/DeviceContext';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';
import { ThemeProvider } from '@/contexts/providers';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ReactNode, Suspense, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import Header from '@/components/Header';
import { SearchProvider } from '@/contexts/SearchContext';
import Margin from '@/components/Margin';
import RegisterSW from '@/components/RegisterSW';
import { NavigationEvents } from '@/components/NewUserNavigation';
import BottomNavigationBar from '@/components/UI/BottomNavigation';
import { GlobalSidebar } from '@/components/UI/Sidebar';
import { WebnovelsProvider } from '@/contexts/WebnovelsContext';
import LanguageSetter from "@/components/LanguageSetter";
import { auth } from "@/auth";
import { ToastProvider } from '@/hooks/use-toast';
import { CreateMediaProvider } from "@/contexts/CreateMediaContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { headers } from 'next/headers';
import UserProviderServer from "@/contexts/UserProviderServer";
import WebnovelsProviderServer from "@/contexts/WebnovelsProviderServer";

interface RootLayoutProps {
    children: ReactNode;
}

export const metadata: Metadata = {
    title: '투니즈 Toonyz',
    description: '웹소설 숏폼 애니메이션 글로벌 스토리 플랫폼',
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        url: 'https://toonyz.com',
        title: '투니즈 Toonyz',
        description: '웹소설 숏폼 애니메이션 글로벌 스토리 플랫폼',
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
        description: '웹소설 숏폼 애니메이션 글로벌 스토리 플랫폼',
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

export async function getUserSession() {
    const headersList = headers();
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const host = headersList.get('host');

    const url = `${protocol}://${host}/api/user_session`;

    const res = await fetch(url, {
        headers: {
            cookie: headersList.get('cookie') || '',
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data;
}

export async function getWebnovelsMetadata() {
    const headersList = headers();
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const host = headersList.get('host');

    const url = `${protocol}://${host}/api/get_webnovels_metadata`;
    const response = await fetch(url,
        {
            next: {
                tags: ['webnovels']
            }
        }
    );
    if (!response.ok) {
        console.error("Failed to fetch webnovels metadata", response.status);
        return [];
    }
    const data = await response.json();
    return data;
}

export default async function RootLayout({ children }: RootLayoutProps) {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const user = await getUserSession();
    const webnovelsMetadata = await getWebnovelsMetadata();

    return (
        <html lang="en" translate="no" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
                />
            </head>
            <body className={`antialiased dark`}>
                <GoogleAnalytics />
                <RegisterSW />

                <ToastProvider>
                    <LanguageProvider>
                        <LanguageSetter />
                        <WebnovelsProviderServer webnovelsMetadata={webnovelsMetadata}>
                            <ThemeProvider>
                                <UserProviderServer user={user}>
                                    <AuthProvider>
                                        <DeviceProvider>
                                            <MobileMenuProvider>
                                                <SearchProvider>
                                                    <CreateMediaProvider>
                                                        <div className={`relative font-pretendard pretendard-jp pretendard-std`}>
                                                            <Suspense>
                                                                <NavigationEvents />
                                                            </Suspense>
                                                            <Suspense>
                                                                <Header isLoggedIn={isLoggedIn} />
                                                            </Suspense>
                                                            <Margin>
                                                                <div className="pl-0 overflow-x-hidden">  {/* The side bar width is 72px md:pl-[72px] */}
                                                                    {children}
                                                                </div>
                                                                <Analytics />
                                                            </Margin>
                                                            <div className="hidden md:flex md:z-[1300] justify-center items-center">  {/* no sidebar on mobile */}
                                                                <GlobalSidebar />
                                                            </div>
                                                            <div className="block md:hidden z-[99]">
                                                                <BottomNavigationBar />
                                                            </div>
                                                        </div>
                                                    </CreateMediaProvider>
                                                </SearchProvider>
                                            </MobileMenuProvider>
                                        </DeviceProvider>
                                    </AuthProvider>
                                </UserProviderServer>
                            </ThemeProvider>
                        </WebnovelsProviderServer>
                    </LanguageProvider>
                </ToastProvider>
                <script src="https://kit.fontawesome.com/ca5078bbee.js" crossOrigin="anonymous" async></script>
                <script src="https://cdn.iamport.kr/v1/iamport.js" async></script>
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6123598702567464"
                    crossOrigin="anonymous"></script>
            </body>
        </html >
    );
}
