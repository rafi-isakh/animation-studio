    "use client"
import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
    const { isLoggedIn, loading } = useAuth();

    useEffect(() => {
        const checkUser = async () => {
            try {
                let data: any;
                const response = await fetch('/api/user_session');
                data = await response.json();
                if (!data.email) {
                    throw new Error("email should be present in response from /api/user_session")
                }
                setNickname(data.nickname);
                setEmail(data.email);
                setBio(data.bio);
            } catch (error) {
                console.error('Error checking user:', error);
            }
        };
        if (isLoggedIn) {
            checkUser();
        }
    }, [pathname, loading]);

    return (
        <userContext.Provider value={{
            email, setEmail,
            nickname, setNickname,
            bio, setBio
        }}>
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
