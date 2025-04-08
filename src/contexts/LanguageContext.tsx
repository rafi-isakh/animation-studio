"use client"
// contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Language, Dictionary } from "@/components/Types"
import phrases from '@/utils/phrases';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: Dictionary;
  isRtl: string;
  setLanguageOverride: (language: Language) => void;
  clearLanguageOverride: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [dictionary, setDictionary] = useState<Dictionary>({});
  const [isRtl, setIsRtl] = useState("ltr");

  useEffect(() => {
    const fetchPhrases = async () => {
      const dictionary = await phrases();
      setDictionary(dictionary);
    }
    fetchPhrases();
    setLanguage(localStorage.getItem('language_override') as Language);
    if (language == 'ar') {
      setIsRtl("rtl");
    }
    else {
      setIsRtl("ltr")
    }
  }, []);

  useEffect(() => {
    console.log("language modified to", language);
  }, [language]);

  const setLanguageOverride = (language: Language) => {
    setLanguage(language);
    localStorage.setItem('language_override', language);
  }

  const clearLanguageOverride = () => {
    localStorage.removeItem('language_override');
  }

return (
  <LanguageContext.Provider value={{ language, setLanguage, dictionary, isRtl, setLanguageOverride, clearLanguageOverride }}>
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