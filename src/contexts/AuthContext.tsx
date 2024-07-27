"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextProps {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean | null ) => void;
  loading: boolean | null;
}

const authContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth_session');
        const data = await response.json();
        console.log(data);
        console.log('data.accessToken', data.accessToken)
        console.log("data.loggedIn", data.loggedIn)
        setIsLoggedIn(data.loggedIn);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    console.log("useAuth firing");
  }, []);

  return (
    <authContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading}}>
      {children}
    </authContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
