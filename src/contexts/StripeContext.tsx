"use client"
// contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface StripeContextType {
  stars: number;
  setStars: (stars: number) => void;
  discount: number;
  setDiscount: (discount: number) => void;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stars, setStars] = useState<number>(1000);
  const [discount, setDiscount] = useState<number>(1);

return (
  <StripeContext.Provider value={{ stars, setStars, discount, setDiscount }}>
    {children}
  </StripeContext.Provider>
);
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};