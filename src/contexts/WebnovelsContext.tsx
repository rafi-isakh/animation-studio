"use client"
import { Chapter, Webnovel } from '@/components/Types';
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context state
interface WebnovelsContextState {
    webnovels: Array<Webnovel>; // Replace 'any' with a more specific type if available
    chaptersLikelyNeededWebnovel: Webnovel | undefined;
    fetchChaptersLikelyNeededWebnovel: (webnovel: Webnovel) => void;
    setWebnovels: React.Dispatch<React.SetStateAction<Array<Webnovel>>>;
    addWebnovel: (webnovel: Webnovel) => void; // Replace 'any' with a more specific type if available
    getWebnovelById: (id: string) => Webnovel | undefined;
    getWebnovelsByAuthorEmailHash: (emailHash: string) => Array<Webnovel>;
}

// Create the context with a default value
const WebnovelsContext = createContext<WebnovelsContextState | undefined>(undefined);

// Create a provider component
export const WebnovelsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [webnovels, setWebnovels] = useState<Array<Webnovel>>([]); // Replace 'any' with a more specific type if available
    const [chaptersLikelyNeededWebnovel, setChaptersLikelyNeededWebnovel] = useState<Webnovel | undefined>(undefined);

    const addWebnovel = (webnovel: Webnovel) => { // Replace 'any' with a more specific type if available
        setWebnovels((prevWebnovels) => [...prevWebnovels, webnovel]);
    };

    const getWebnovelById = (id: string) => {
        return webnovels.find((webnovel) => webnovel.id.toString() === id);
    };

    const getWebnovelsByAuthorEmailHash = (emailHash: string) => {
        return webnovels.filter((webnovel) => webnovel.user.email_hash === emailHash);
    };

    const fetchChaptersLikelyNeededWebnovel = async (webnovel: Webnovel) => {
        setChaptersLikelyNeededWebnovel(webnovel);
        const response = await fetch(`/api/get_webnovel_by_id?id=${webnovel.id}`);
        const data = await response.json();
        setWebnovels([...webnovels.filter((webnovel) => webnovel.id !== data.id), data]);
    };

    return (
        <WebnovelsContext.Provider value={{ webnovels, setWebnovels, addWebnovel, getWebnovelById, getWebnovelsByAuthorEmailHash, chaptersLikelyNeededWebnovel, fetchChaptersLikelyNeededWebnovel }}>
            {children}
        </WebnovelsContext.Provider>
    );
};

// Custom hook to use the WebnovelsContext
export const useWebnovels = (): WebnovelsContextState => {
    const context = useContext(WebnovelsContext);
    if (!context) {
        throw new Error('useWebnovels must be used within a WebnovelsProvider');
    }
    return context;
};
