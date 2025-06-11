"use client"
import { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface AuthContextProps {
    isLoggedIn: boolean;
    loading: boolean;
    login: (provider: string, redirect: boolean, callbackUrl: string) => void;
    logout: (redirect: boolean, callbackUrl: string) => void;
    email: string | null;
    session: any;
}

const authContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { data: session, status } = useSession();
    
    const isLoggedIn = !!session?.user;
    const loading = status === 'loading';
    const email = session?.user?.email || null;

    async function login(provider: string, redirect: boolean, callbackUrl: string) {
        try {
            await signIn(provider, { 
                redirect: redirect, 
                redirect_uri: callbackUrl, 
                callbackUrl: callbackUrl, 
                redirectTo: callbackUrl 
            });
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async function logout(redirect: boolean, callbackUrl: string) {
        try {
            await signOut({ 
                redirect: redirect, 
                callbackUrl: callbackUrl 
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    return (
        <authContext.Provider value={{ 
            isLoggedIn, 
            loading, 
            login, 
            logout, 
            email,
            session
        }}>
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
