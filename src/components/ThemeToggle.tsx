'use client'
import { useTheme } from '@/contexts/providers'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { language, dictionary } = useLanguage();
  
  return (
    <button 
      onClick={() => toggleTheme(theme == 'dark'? 'light': 'dark')}
      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-800 w-full dark:text-white hover:text-gray-400 dark:hover:text-gray-400"
    >
     {phrase(dictionary, theme === 'dark' ? 'LightMode' : 'DarkMode', language)}
    </button>
  )
}