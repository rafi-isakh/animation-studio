"use client"
import { Chapter, Webnovel } from '@/components/Types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the context state
interface WebnovelsContextState {
    webnovels: Array<Webnovel>; // Replace 'any' with a more specific type if available
    chaptersLikelyNeededWebnovel: Webnovel | undefined;
    fetchChaptersLikelyNeededWebnovel: (webnovel: Webnovel) => void;
    setWebnovels: React.Dispatch<React.SetStateAction<Array<Webnovel>>>;
    addWebnovel: (webnovel: Webnovel) => void; // Replace 'any' with a more specific type if available
    getWebnovelById: (id: string) => Promise<Webnovel | undefined>;
    getWebnovelsMetadataByEmailHash: (emailHash: string) => Promise<Array<Webnovel>>;
    invalidateCache: () => void;
}

// Create the context with a default value
const WebnovelsContext = createContext<WebnovelsContextState | undefined>(undefined);

// Create a provider component
export const WebnovelsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [webnovels, setWebnovels] = useState<Array<Webnovel>>([]); // Replace 'any' with a more specific type if available
    const [chaptersLikelyNeededWebnovel, setChaptersLikelyNeededWebnovel] = useState<Webnovel | undefined>(undefined);

    const invalidateCache = () => {
        setWebnovels([]);
    }

    const addWebnovel = (webnovel: Webnovel) => { 
        setWebnovels((prevWebnovels) => [...prevWebnovels, webnovel]);
    };

    const getWebnovelById = async (id: string) => {
        const webnovel = webnovels.find((webnovel) => webnovel.id.toString() === id);
        if (webnovel) {
            return Promise.resolve(webnovel);
        } else {
            const response = await fetch(`/api/get_webnovel_by_id?id=${id}`, {
                cache: 'no-store',
            });
            if (!response.ok) {
                console.error("Failed to fetch webnovel by id", response.status);
                return undefined;
            }
            const data = await response.json();
            return data;
        }
    };

    const getWebnovelsMetadataByEmailHash = async (emailHash: string) => {
        const filteredWebnovels = webnovels.filter((webnovel) => webnovel.user.email_hash === emailHash);
        if (filteredWebnovels.length > 0) {
            return Promise.resolve(filteredWebnovels);
        } else {
            const response = await fetch(`/api/get_webnovels_metadata_by_email_hash?email_hash=${emailHash}`,
                {
                    cache: 'no-store',
                }
            );
            if (!response.ok) {
                console.error("Failed to fetch webnovels metadata by email hash", response.status);
                return [];
            }
            const data = await response.json();
            return data;
        }
    };

    const fetchChaptersLikelyNeededWebnovel = async (webnovel: Webnovel) => {
        const response = await fetch(`/api/get_webnovel_by_id?id=${webnovel.id}`, {
            cache: 'no-store',
        });
        const data = await response.json();
        setWebnovels([...webnovels.filter((webnovel) => webnovel.id !== data.id), data]);
        setChaptersLikelyNeededWebnovel(webnovel);
    };

    return (
        <WebnovelsContext.Provider value={{ webnovels, setWebnovels, addWebnovel, getWebnovelById, getWebnovelsMetadataByEmailHash, chaptersLikelyNeededWebnovel, fetchChaptersLikelyNeededWebnovel, invalidateCache }}>
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
