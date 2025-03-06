"use client"
import { Chapter, Webnovel } from '@/components/Types';
import { temporarilyUnpublished } from '@/utils/webnovelUtils';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of the context state
interface WebnovelsContextState {
    webnovels: Array<Webnovel>; // Replace 'any' with a more specific type if available
    chaptersLikelyNeededWebnovel: Webnovel | undefined;
    fetchChaptersLikelyNeededWebnovel: (webnovel: Webnovel) => void;
    getWebnovelById: (id: string) => Promise<Webnovel | undefined>;
    getWebnovelsMetadataByUserId: (userId: string) => Promise<Array<Webnovel>>;
    invalidateCache: () => void;
}

// Create the context with a default value
const WebnovelsContext = createContext<WebnovelsContextState | undefined>(undefined);
// Create a provider component
export const WebnovelsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [webnovels, setWebnovels] = useState<Array<Webnovel>>([]); 
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

    // todo: clearly delineate between webnovel metadata and webnovel with content
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

    const getWebnovelsMetadataByUserId = async (userId: string) => {
        const filteredWebnovels = webnovels.filter((webnovel) => webnovel.user.id.toString() === userId);
        if (filteredWebnovels.length > 0) {
            return Promise.resolve(filteredWebnovels);
        } else {
            const response = await fetch(`/api/get_webnovels_metadata_by_user_id?user_id=${userId}`,
                {
                    cache: 'no-store',
                }
            );
            if (!response.ok) {
                console.error("Failed to fetch webnovels metadata by user id", response.status);
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
        <WebnovelsContext.Provider value={{ webnovels, getWebnovelById, getWebnovelsMetadataByUserId, chaptersLikelyNeededWebnovel, fetchChaptersLikelyNeededWebnovel, invalidateCache }}>
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
