"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextProps {
  email: string | null;
  setEmail: (email: string | null) => void;
  nickname: string | null;
  setNickname: (nickname: string | null) => void;
}

const userContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/user_session');
        const data = await response.json();
        console.log("UserContext fetched data", data)
        setNickname(data.nickname);
        setEmail(data.email);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
  }, []);

  return (
    <userContext.Provider value={{  email, setEmail, 
                                    nickname, setNickname}}>
      {children}
    </userContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(userContext);
  if (!context) {
    throw new Error('useUser must be used within an UserProvider');
  }
  return context;
};
