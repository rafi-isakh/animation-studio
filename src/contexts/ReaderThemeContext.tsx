'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useTheme } from './providers'

export type ReaderTheme = 'dark' | 'light' | 'sepia'

type ReaderThemeContextType = {
  readerTheme: ReaderTheme
  toggleReaderTheme: (theme: ReaderTheme) => void
}

const ReaderThemeContext = createContext<ReaderThemeContextType | undefined>(undefined)

export function ReaderThemeProvider({ children }: { children: React.ReactNode }) {
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('light')
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedReaderTheme = localStorage.getItem('readerTheme') as ReaderTheme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedReaderTheme) {
      toggleReaderTheme(savedReaderTheme)
    } else if (systemPrefersDark) {
      toggleReaderTheme('dark')
    }
    return () => {
      toggleTheme(theme)
    }
  }, [])

  useEffect(() => {
    // Update document class when theme changes
    document.documentElement.className = readerTheme
    localStorage.setItem('readerTheme', readerTheme)
  }, [readerTheme])

  const toggleReaderTheme = (newReaderTheme: ReaderTheme) => {
    setReaderTheme(newReaderTheme)
  }

  return (
    <ReaderThemeContext.Provider value={{ readerTheme, toggleReaderTheme }}>
      {children}
    </ReaderThemeContext.Provider>
  )
}

export function useReaderTheme() {
  const context = useContext(ReaderThemeContext)
  if (context === undefined) {
    throw new Error('useReaderTheme must be used within a ReaderThemeProvider')
  }
  return context
}
