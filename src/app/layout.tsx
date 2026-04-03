// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"
import '@/styles/globals.css';
import { Metadata } from 'next'
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ReactNode } from 'react';
import LanguageSetter from "@/components/LanguageSetter";
import { ToastProvider } from '@/hooks/use-toast';
import { ProjectProvider } from "@/contexts/ProjectContext";
import { MithrilAuthProvider } from "@/components/Mithril/auth";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" translate="no" suppressHydrationWarning>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
                />
                <meta name='probely-verification' content='2ce69ec2-3d2a-48ac-af88-41cee1e23f49' />
            </head>
            <body className="antialiased dark">
                <GoogleAnalytics />
                <ToastProvider>
                    <LanguageProvider>
                        <LanguageSetter />
                        <MithrilAuthProvider>
                            <ProjectProvider>
                                <div className="relative font-pretendard pretendard-jp pretendard-std">
                                    {children}
                                    <Analytics />
                                </div>
                            </ProjectProvider>
                        </MithrilAuthProvider>
                    </LanguageProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
