"use client"

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/N_logo_with_heart.json';

export default function UserLoggedIn() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || '/';
    const router = useRouter();
    const { setIsLoggedIn } = useAuth();

    useEffect(() => {
        const handleRedirect = async () => {
            // Give NextAuth time to establish the session
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Trigger auth context to refresh
            setIsLoggedIn(true);
            
            // Small additional delay to ensure session is ready
            await new Promise(resolve => setTimeout(resolve, 200));
            
            router.push(returnTo);
        };

        handleRedirect();
    }, [returnTo, router, setIsLoggedIn]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <LottieLoader animationData={animationData} width="w-40" centered={true} pulseEffect={true} />
            </div>
        </div>
    );
}