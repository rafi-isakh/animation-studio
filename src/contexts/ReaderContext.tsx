"use client"
import React, { createContext, useState, useContext, useEffect } from 'react';

const ReaderContext = createContext<{
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  textColor: string;
  setTextColor: (color: string) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
} | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('default');
  const [textColor, setTextColor] = useState('#000000');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  useEffect(() => {
    const savedSettings = localStorage.getItem('readerSettings');
    if (savedSettings) {
      const { fontSize, fontFamily, textColor, lineHeight, backgroundColor } = JSON.parse(savedSettings);
      setFontSize(fontSize);
      setFontFamily(fontFamily);
      setTextColor(textColor);
      setLineHeight(lineHeight);
      setBackgroundColor(backgroundColor);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify({
      fontSize,
      fontFamily,
      textColor,
      lineHeight,
      backgroundColor
    }));
  }, [fontSize, fontFamily, textColor, lineHeight, backgroundColor]);

  const value = {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    textColor,
    setTextColor,
    lineHeight,
    setLineHeight,
    backgroundColor,
    setBackgroundColor
  };

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}