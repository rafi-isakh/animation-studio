"use client"
import React, { createContext, Dispatch, SetStateAction, useState, useContext, useEffect } from 'react';

const ReaderContext = createContext<{
    fontSize: number;
    setFontSize: (size: number) => void;
    fontFamily: string;
    setFontFamily: (family: string) => void;
    textColor: string;
    setTextColor: (color: string) => void;
    lineHeight: number;
    setLineHeight: (height: number) => void;
    margin: number;
    setMargin: (margin: number) => void;
    padding: number;
    setPadding: (padding: number) => void;
    containerWidth?: number;
    setContainerWidth: (width: number) => void;
    scrollType: "horizontal" | "vertical";
    setScrollType: (scrollType: "horizontal" | "vertical") => void;
    page: number;
    setPage: Dispatch<SetStateAction<number>>
    maxPage: number;
    setMaxPage: Dispatch<SetStateAction<number>>
} | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('default');
  const [textColor, setTextColor] = useState('#000000');
  const [lineHeight, setLineHeight] = useState(1.8);
  const [margin, setMargin] = useState(10);
  const [padding, setPadding] = useState(10);
  const [scrollType, setScrollType] = useState<"vertical" | "horizontal">('vertical');
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(); 

  useEffect(() => {
    const savedSettings = localStorage.getItem('readerSettings');
    if (savedSettings) {
      const { fontSize, fontFamily, textColor, lineHeight, margin, padding } = JSON.parse(savedSettings);
      setFontSize(fontSize);
      setFontFamily(fontFamily);
      setTextColor(textColor);
      setLineHeight(lineHeight);
      setMargin(margin);
      setPadding(padding);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify({
      fontSize,
      fontFamily,
      textColor,
      lineHeight,
      margin,
      padding
    }));
  }, [fontSize, fontFamily, textColor, lineHeight, margin, padding]);

  const value = {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    textColor,
    setTextColor,
    lineHeight,
    setLineHeight,
    margin,
    setMargin,
    padding,
    setPadding,
    scrollType,
    setScrollType,
    page,
    setPage,
    containerWidth,
    setContainerWidth,
    maxPage,
    setMaxPage,
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