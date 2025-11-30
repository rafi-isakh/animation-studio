"use client";

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Input } from '@/components/shadcnUI/Input';
import { Button } from '@/components/shadcnUI/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';

const STORAGE_KEY = 'mithril_access';

interface PasscodeGateProps {
    children: ReactNode;
}

const PasscodeGate: React.FC<PasscodeGateProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { language, dictionary } = useLanguage();

    useEffect(() => {
        const storedAccess = localStorage.getItem(STORAGE_KEY);
        if (storedAccess === 'true') {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const correctPasscode = process.env.NEXT_PUBLIC_MITHRIL_PASSCODE;

        if (passcode === correctPasscode) {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsAuthenticated(true);
        } else {
            setError(phrase(dictionary, "mithril_passcode_error", language));
            setPasscode('');
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    // Show loading state while checking localStorage (prevents flash)
    if (isAuthenticated === null) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show passcode gate if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white dark:bg-[#211F21] rounded-xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#DB2777]/10 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-[#DB2777]" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            {phrase(dictionary, "mithril_passcode_title", language)}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {phrase(dictionary, "mithril_passcode_subtitle", language)}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="password"
                                placeholder={phrase(dictionary, "mithril_passcode_placeholder", language)}
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="w-full h-12 text-center text-lg tracking-widest bg-gray-50 dark:bg-[#2a282a] border-gray-200 dark:border-gray-700"
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2 text-center">
                                    {error}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#DB2777] hover:bg-[#DB2777]/90 text-white font-medium"
                        >
                            {phrase(dictionary, "mithril_passcode_unlock", language)}
                        </Button>
                    </form>

                    <button
                        onClick={handleGoBack}
                        className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        {phrase(dictionary, "mithril_passcode_goback", language)}
                    </button>
                </div>
            </div>
        );
    }

    // Authenticated - render children
    return <>{children}</>;
};

export default PasscodeGate;
