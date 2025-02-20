"use client"
import { Chapter, Webnovel } from '@/components/Types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the context state
interface WebnovelsContextState {
    webnovels: Array<Webnovel>; // Replace 'any' with a more specific type if available
    chaptersLikelyNeededWebnovel: Webnovel | undefined;
    fetchChaptersLikelyNeededWebnovel: (webnovel: Webnovel) => void;
    getWebnovelById: (id: string) => Promise<Webnovel | undefined>;
    getWebnovelsMetadataByEmailHash: (emailHash: string) => Promise<Array<Webnovel>>;
    invalidateCache: () => void;
}

//const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];
const temporarilyUnpublished: number[] = []
// Create the context with a default value
const WebnovelsContext = createContext<WebnovelsContextState | undefined>(undefined);
// Create a provider component
export const WebnovelsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [webnovels, setWebnovels] = useState<Array<Webnovel>>([]); // Replace 'any' with a more specific type if available
    const [chaptersLikelyNeededWebnovel, setChaptersLikelyNeededWebnovel] = useState<Webnovel | undefined>(undefined);

    const fetchWebnovelsMetadata = async () => {
        const response = await fetch(`/api/get_webnovels_metadata`, {
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error("Failed to fetch webnovels metadata", response.status);
        }
        const data = await response.json();
        setWebnovels(data.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id)));
    }

    useEffect(() => {
        fetchWebnovelsMetadata();
    }, []);

    const invalidateCache = () => {
        fetchWebnovelsMetadata();
    }

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
        setWebnovels([...webnovels.filter((w) => w.id !== Number(data.id)), data]);
        setChaptersLikelyNeededWebnovel(webnovel);
    };

    return (
        <WebnovelsContext.Provider value={{ webnovels, getWebnovelById, getWebnovelsMetadataByEmailHash, chaptersLikelyNeededWebnovel, fetchChaptersLikelyNeededWebnovel, invalidateCache }}>
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
