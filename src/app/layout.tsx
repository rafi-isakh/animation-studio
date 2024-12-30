// app/layout.tsx
import '@/styles/globals.css';
import { Metadata } from 'next'

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

import RootLayoutClient from '@/app/layout.client'
export default RootLayoutClient
