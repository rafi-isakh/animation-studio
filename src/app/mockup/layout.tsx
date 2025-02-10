import type React from "react" 
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./page.module.css"
import { ThemeProvider } from "@/contexts/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Toonyz version 1.5",
  description: "Toonyz product designversion 1.5",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className={`${inter.className} h-full font-pretendard`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </div>
  )
}