"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';

interface AuthContextProps {
    isLoggedIn: boolean | null;
    setIsLoggedIn: (loggedIn: boolean | null) => void;
    loading: boolean | null;
    login: (provider: string, redirect: boolean, callbackUrl: string) => void;
    logout: (redirect: boolean, callbackUrl: string) => void;
}

const authContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [invokeAuthCheck, setInvokeAuthCheck] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/auth_session');
                const data = await response.json();
                setIsLoggedIn(data.loggedIn);
            } catch (error) {
                console.error('Error checking auth:', error);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [pathname, invokeAuthCheck]);


    async function login(provider: string, redirect: boolean, callbackUrl: string) {
        await signIn(provider, { redirect: redirect, callbackUrl: callbackUrl, redirectTo: callbackUrl });
        setInvokeAuthCheck(!invokeAuthCheck);
    }

    async function logout(redirect: boolean, callbackUrl: string) {
        await signOut({ redirect: redirect, callbackUrl: callbackUrl });
        setInvokeAuthCheck(!invokeAuthCheck);
    }

    return (
        <authContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading, login, logout }}>
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
