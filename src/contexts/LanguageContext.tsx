"use client"
// contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Language, Dictionary } from "@/components/Types"
import phrases from '@/utils/phrases';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getInitialLanguage = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') as Language || 'ko'; // Default language
    }
    return 'en';
  };

  const [language, setLanguage] = useState(getInitialLanguage);
  const [dictionary, setDictionary] = useState<Dictionary>({});
  
  useEffect(() => {
    const fetchPhrases = async () => {
      const dictionary = await phrases();
      console.log(dictionary);
      setDictionary(dictionary)
    }
    fetchPhrases();
  }, [])


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};