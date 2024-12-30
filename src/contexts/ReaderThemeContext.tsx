'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useTheme, Theme } from './providers'

export type ReaderTheme = Theme 

type ReaderThemeContextType = {
  readerTheme: ReaderTheme
  toggleReaderTheme: (theme: ReaderTheme) => void
}

const ReaderThemeContext = createContext<ReaderThemeContextType | undefined>(undefined)

export function ReaderThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(theme)

  // Sync with main theme initially and when it changes
  useEffect(() => {
    const savedReaderTheme = localStorage.getItem('readerTheme') as ReaderTheme
    if (savedReaderTheme) {
      setReaderTheme(savedReaderTheme)
    } else {
      setReaderTheme(theme)
    }
  }, [theme])

  // Handle theme changes and storage
  const toggleReaderTheme = (newTheme: ReaderTheme) => {
    setReaderTheme(newTheme)
    localStorage.setItem('readerTheme', newTheme)
    document.documentElement.classList.remove('light', 'dark', 'sepia')
    document.documentElement.classList.add(newTheme)
  }

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'sepia')
    document.documentElement.classList.add(readerTheme)
  }, [readerTheme])

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('light', 'dark', 'sepia')
      document.documentElement.classList.add(theme)
    }
  }, [theme])

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