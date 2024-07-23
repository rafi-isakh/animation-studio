"use client"
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextProps {
  email: string;
  setEmail: (email: string) => void;
  nickname: string;
  setNickname: (nickname: string) => void;
  bio: string;
  setBio: (bio: string) => void;
}

const userContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [email, setEmail] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/user_session');
        const data = await response.json();
        console.log("UserContext fetched data", data)
        if (!data.nickname || !data.email) {
          throw new Error("nickname and email should be present in response from /api/user_session")
        }
        setNickname(data.nickname);
        setEmail(data.email);
        setBio(data.bio);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };
    checkUser();
  }, [pathname]);

  return (
    <userContext.Provider value={{  email, setEmail, 
                                    nickname, setNickname,
                                    bio, setBio}}>
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
