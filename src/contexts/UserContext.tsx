    "use client"
import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserContextProps {
    email: string;
    setEmail: (email: string) => void;
    nickname: string;
    setNickname: (nickname: string) => void;
    bio: string;
    setBio: (bio: string) => void;
    stars: number;
    picture: string;
    purchased_webnovel_chapters: number[];
    setInvokeCheckUser: Dispatch<SetStateAction<boolean>>;
    checking: boolean;
    upvotedComments: string[];
    setUpvotedComments: (upvotedComments: string[]) => void;
}

const userContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [email, setEmail] = useState<string>("");
    const [nickname, setNickname] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    const [stars, setStars] = useState<number>(0);
    const [picture, setPicture] = useState<string>("");
    const [purchased_webnovel_chapters, setPurchasedWebnovelChapters] = useState<number[]>([]);
    const [upvotedComments, setUpvotedComments] = useState<string[]>([]);
    const pathname = usePathname();
    const [invokeCheckUser, setInvokeCheckUser] = useState<boolean>(false);
    const [checking, setChecking] = useState<boolean>(false);
    const { isLoggedIn, loading } = useAuth();

    useEffect(() => {
        const checkUser = async () => {
            try {
                setChecking(true);
                let data: any;
                const response = await fetch('/api/user_session');
                if (!response.ok) {
                    throw new Error(response.statusText)
                }
                data = await response.json();
                setNickname(data.nickname);
                setEmail(data.email);
                setBio(data.bio);
                setStars(data.stars);
                setPicture(data.picture);
                setPurchasedWebnovelChapters(JSON.parse(data.purchased_webnovel_chapters));
                setChecking(false);
                setUpvotedComments(data.upvoted_comments);
            } catch (error) {
                console.error('Error checking user:', error);
            }
        };
        if (isLoggedIn) {
            checkUser();
        }
    }, [pathname, loading, invokeCheckUser]);

    return (
        <userContext.Provider value={{
            email, setEmail,
            nickname, setNickname,
            bio, setBio,
            stars,
            picture,
            purchased_webnovel_chapters,
            setInvokeCheckUser,
            checking,
            upvotedComments, setUpvotedComments
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
