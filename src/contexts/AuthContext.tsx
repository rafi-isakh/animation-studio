"use client"
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { useUser } from './UserContext';

interface AuthContextProps {
    isLoggedIn: boolean | null;
    setIsLoggedIn: (loggedIn: boolean | null) => void;
    loading: boolean | null;
    login: (provider: string, redirect: boolean, callbackUrl: string) => void;
    logout: (redirect: boolean, callbackUrl: string) => void;
    email: string | null;
    setEmail: (email: string | null) => void;
}

const authContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [invokeAuthCheck, setInvokeAuthCheck] = useState(false);
    const pathname = usePathname();
    const isCheckingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const checkAuth = useCallback(async () => {
        // Prevent concurrent auth checks
        if (isCheckingRef.current) {
            return;
        }

        try {
            isCheckingRef.current = true;
            setLoading(true);
            
            const response = await fetch('/api/auth_session', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            
            if (!response.ok) {
                throw new Error('Auth check failed');
            }
            
            const data = await response.json();
            setIsLoggedIn(data.loggedIn);
            setEmail(data.email);
            console.log('Auth check result:', data);
        } catch (error) {
            console.error('Error checking auth:', error);
            // On error, assume not logged in
            setIsLoggedIn(false);
            setEmail(null);
        } finally {
            setLoading(false);
            isCheckingRef.current = false;
        }
    }, []);

    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Debounce the auth check to prevent rapid successive calls
        timeoutRef.current = setTimeout(() => {
            checkAuth();
        }, 100);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [invokeAuthCheck, checkAuth]);

    async function login(provider: string, redirect: boolean, callbackUrl: string) {
        try {
            await signIn(provider, { redirect: redirect, redirect_uri: callbackUrl, callbackUrl: callbackUrl, redirectTo: callbackUrl });
            setIsLoggedIn(true);
            // Use a small delay to allow the session to be established
            setTimeout(() => {
                setInvokeAuthCheck(prev => !prev);
            }, 500);
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async function logout(redirect: boolean, callbackUrl: string) {
        try {
            await signOut({ redirect: redirect, callbackUrl: callbackUrl });
            setIsLoggedIn(false);
            setEmail(null);
            // Use a small delay to allow the session to be cleared
            setTimeout(() => {
                setInvokeAuthCheck(prev => !prev);
            }, 500);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    return (
        <authContext.Provider value={{ isLoggedIn, setIsLoggedIn, loading, login, logout, email, setEmail }}>
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
