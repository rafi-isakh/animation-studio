// components/GoogleAnalytics.jsx
'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

const GA_ID = 'G-1338KK6L7G'

export default function GoogleAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!window.gtag) return
    window.gtag('config', GA_ID, {
      page_path: pathname,
    })
  }, [pathname])

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}></script>
      <script dangerouslySetInnerHTML={{
        __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
        `
      }} />
    </>
  )
}
