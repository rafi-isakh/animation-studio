'use client';

import { useWebnovels } from '@/contexts/WebnovelsContext';
import { Webnovel } from '@/components/Types';
import { useEffect } from 'react';

interface WebnovelsDataProviderProps {
    webnovels: Webnovel[];
}

const WebnovelsDataProvider: React.FC<WebnovelsDataProviderProps> = ({ webnovels }) => {
    const { setWebnovels } = useWebnovels();

    // Set the webnovels data using the hook
    useEffect(() => {
        setWebnovels(webnovels);
    }, [webnovels]);

    return null; // This component doesn't render anything
};

export default WebnovelsDataProvider;