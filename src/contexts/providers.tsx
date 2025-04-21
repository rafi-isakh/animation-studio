'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'sepia' | 'system'

type ThemeContextType = {
  theme: Theme
  toggleTheme: (theme: Theme) => void
  isDarkMode: boolean
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'; 
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system' as Theme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const [hasMounted, setHasMounted] = useState(false);
  
  // Calculate the effective theme (what should actually be displayed)
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  // isDarkMode should be based on the effective theme, not just the theme preference
  const isDarkMode = effectiveTheme === 'dark';

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme') as Theme
    const systemTheme = getSystemTheme()
    if (savedTheme && ['light', 'dark', 'sepia', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }

    setHasMounted(true);
    setSystemTheme(systemTheme);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => {
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, [hasMounted]);

  // Add an effect to apply the effectiveTheme whenever it changes
  useEffect(() => {
    if (!hasMounted) return;
    
    // Only run on the client side
    if (typeof document === 'undefined') return;
    
    document.body.classList.remove('light', 'dark', 'sepia');
    // Add the effective theme class (which is always light, dark, or sepia at this point)
    document.body.classList.add(effectiveTheme);
  }, [effectiveTheme, hasMounted]);

  const toggleTheme = (newTheme: Theme) => {
    // Don't manipulate classes directly here, let the effect handle it
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  }

  // Prevent rendering children until mounted to avoid hydration mismatch issues
  // Children might rely on the theme, which is only determined correctly client-side.
  if (!hasMounted) {
    // Render nothing or a fallback loader on the server/during initial client render
    return null;
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
