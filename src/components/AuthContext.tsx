"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextProps {
  isLoggedIn: boolean | null;
  setIsLoggedIn: (loggedIn: boolean | null) => void;
  email: string | null;
  setEmail: (email: string | null) => void;
  username: string | null;
  setUsername: (username: string | null) => void;
}

const authContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [email, setEmail] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        setIsLoggedIn(data.loggedIn);
        setUsername(data.username);
        setEmail(data.email);
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  return (
    <authContext.Provider value={{ isLoggedIn, setIsLoggedIn, email, setEmail, username, setUsername}}>
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
