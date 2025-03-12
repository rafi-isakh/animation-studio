'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'sepia'

type ThemeContextType = {
  theme: Theme
  toggleTheme: (theme: Theme) => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark' as Theme)
  const isDarkMode = theme === 'dark' // New state derived from theme

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme') as Theme
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme) {
      toggleTheme(savedTheme)
    } else if (systemPrefersDark) {
      toggleTheme('dark')
    } 

  }, [])

  const toggleTheme = (newTheme: Theme) => {
    // document.documentElement.className = newTheme
    // localStorage.setItem('theme', newTheme)
    // setTheme(newTheme)
    document.body.classList.remove('light', 'dark', 'sepia')
    document.body.classList.add(newTheme)
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
