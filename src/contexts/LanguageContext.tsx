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
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getInitialLanguage = () => {
    if (window !== undefined) {
    return localStorage.getItem('language') as Language || 'en'; // Default language
  }
  return 'en' as Language;
};

const [language, setLanguage] = useState(getInitialLanguage);
const [dictionary, setDictionary] = useState<Dictionary>({});
const [isRtl, setIsRtl] = useState("ltr");

useEffect(() => {

  const fetchPhrases = async () => {
    const dictionary = await phrases();
    setDictionary(dictionary);
    // localStorage.setItem("dictionary", JSON.stringify(dictionary));
  }
  // const localDictionary = localStorage.getItem("dictionary")
  // if (localDictionary) {
  //   setDictionary(JSON.parse(localDictionary));
  // } 
  fetchPhrases();
}, [])


useEffect(() => {
  localStorage.setItem('language', language);
  if (language == 'ar') {
    setIsRtl("rtl");
  }
  else {
    setIsRtl("ltr")
  }
}, [language]);

return (
  <LanguageContext.Provider value={{ language, setLanguage, dictionary, isRtl }}>
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