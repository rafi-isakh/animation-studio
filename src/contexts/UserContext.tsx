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
    purchased_webnovel_chapters: [number, string][];
    setInvokeCheckUser: Dispatch<SetStateAction<boolean>>;
    checking: boolean;
    upvotedComments: string[];
    email_hash: string;
    provider: string;
    setUpvotedComments: (upvotedComments: string[]) => void;
    id: string;
    genres: { [key: string]: boolean };
    isAdult: boolean;
    setIsAdult: (isAdult: boolean) => void;
    loggedIn: boolean;
}

const userContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
    userFromServer?: any;
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ userFromServer, children }) => {
    const [email, setEmail] = useState<string>(userFromServer?.email || "");
    const [nickname, setNickname] = useState<string>(userFromServer?.nickname || "");
    const [bio, setBio] = useState<string>(userFromServer?.bio || "");
    const [stars, setStars] = useState<number>(userFromServer ? userFromServer.stars + userFromServer.free_stars : 0);
    const [picture, setPicture] = useState<string>(userFromServer?.picture || "");
    const [purchased_webnovel_chapters, setPurchasedWebnovelChapters] = useState<[number, string][]>(
        userFromServer ? JSON.parse(userFromServer.purchased_webnovel_chapters) : []
    );
    const [upvotedComments, setUpvotedComments] = useState<string[]>(userFromServer?.upvoted_comments || []);
    const [email_hash, setEmailHash] = useState<string>(userFromServer?.email_hash || "");
    const [provider, setProvider] = useState<string>(userFromServer?.provider || "");
    const [id, setId] = useState<string>(userFromServer?.id || "");
    const [genres, setGenres] = useState<{ [key: string]: boolean }>(userFromServer?.genres ? JSON.parse(userFromServer.genres) : {});
    const [isAdult, setIsAdult] = useState<boolean>(userFromServer?.is_adult || false);
    const [invokeCheckUser, setInvokeCheckUser] = useState<boolean>(false);
    const [checking, setChecking] = useState<boolean>(false);
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
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
                setStars(data.stars + data.free_stars);
                setPicture(data.picture);
                setPurchasedWebnovelChapters(JSON.parse(data.purchased_webnovel_chapters));
                setUpvotedComments(data.upvoted_comments);
                setEmailHash(data.email_hash);
                setProvider(data.provider);
                setId(data.id);
                setGenres(JSON.parse(data.genres));
                setIsAdult(data.is_adult);
                setLoggedIn(data.loggedIn);
                setChecking(false);
            } catch (error) {
                console.error('Error checking user:', error);
            }
        };
        checkUser();
    }, [invokeCheckUser]);

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
            upvotedComments, setUpvotedComments,
            email_hash,
            provider,
            id,
            genres,
            isAdult,
            setIsAdult,
            loggedIn,
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
