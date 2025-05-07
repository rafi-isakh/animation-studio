"use client"
import { Chapter, Language, Webnovel } from '@/components/Types';
import { temporarilyUnpublished } from '@/utils/webnovelUtils';
import React, { createContext, useContext, useState, ReactNode, useEffect, Dispatch, SetStateAction } from 'react';
import { useLanguage } from './LanguageContext';

// Define the shape of the context state
interface WebnovelsContextState {
    webnovels: Array<Webnovel>; // Replace 'any' with a more specific type if available
    chaptersLikelyNeededWebnovel: Webnovel | undefined;
    getWebnovelById: (id: string) => Promise<Webnovel | undefined>;
    getWebnovelIdWithChapterMetadata: (id: string) => Promise<Webnovel | undefined>;
    getWebnovelsMetadataByUserId: (userId: string) => Promise<Array<Webnovel>>;
    getWebnovelsMetadataByAuthorId: (authorId: string) => Promise<Array<Webnovel>>;
    getWebnovelMetadataById: (id: string) => Promise<Webnovel | undefined>;
    invalidateCache: () => void;
}

// Create the context with a default value
const WebnovelsContext = createContext<WebnovelsContextState | undefined>(undefined);
// Create a provider component
export const WebnovelsProvider: React.FC<{ children: ReactNode, webnovelsMetadata: Webnovel[] }> = ({ children, webnovelsMetadata }) => {
    const [allWebnovels, setAllWebnovels] = useState<Array<Webnovel>>(webnovelsMetadata);
    const [webnovels, setWebnovels] = useState<Array<Webnovel>>(webnovelsMetadata); 
    const [chaptersLikelyNeededWebnovel, setChaptersLikelyNeededWebnovel] = useState<Webnovel | undefined>(undefined);
    const { language } = useLanguage();
    
    const fetchWebnovelsMetadata = async (language: Language) => {
        const response = await fetch(`/api/get_webnovels_metadata`,
            {
                next: {
                    tags: ['webnovels']
                }
            }
        );
        if (!response.ok) {
            console.error("Failed to fetch webnovels metadata", response.status);
        }
        const data = await response.json();
        setAllWebnovels(data.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id)));
    }

    useEffect(() => {
        fetchWebnovelsMetadata(language);
    }, []);

    useEffect(() => {
        const filteredData = allWebnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id) 
                                                        && novel.available_languages.includes(language));
        setWebnovels(filteredData);
    }, [language, allWebnovels]);

    const invalidateCache = async () => {
        // fetchWebnovelsMetadata except no-store the cache
        const response = await fetch(`/api/get_webnovels_metadata_cache_no_store`, { cache: 'no-store' });
        if (!response.ok) {
            console.error("Failed to fetch webnovels metadata", response.status);
        }
        const data = await response.json();
        setAllWebnovels(data.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id)));
        setWebnovels(data.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id) 
                                                        && novel.available_languages.includes(language)));
    }

    const getWebnovelMetadataById = async (id: string) => {
        const webnovel = webnovels.find((webnovel) => webnovel.id.toString() == id);
        if (webnovel) {
            return Promise.resolve(webnovel);
        } else {
            const response = await fetch(`/api/get_webnovel_metadata_by_id?id=${id}`);
            if (!response.ok) {
                console.error("Failed to fetch webnovel metadata by id", response.status);
                return undefined;
            }
            const data = await response.json();
            return data;
        }
    }

    // may or may not have chapter metadata
    const getWebnovelById = async (id: string) => {
        const webnovel = webnovels.find((webnovel) => webnovel.id.toString() == id);
        if (webnovel) {
            return Promise.resolve(webnovel);
        } else {
            const response = await fetch(`/api/get_webnovel_with_chapter_metadata_by_id?id=${id}`);
            if (!response.ok) {
                console.error("Failed to fetch webnovel by id", response.status);
                return undefined;
            }
            const data = await response.json();
            return data;
        }
    };

    // explicitly with chapter metadata
    const getWebnovelIdWithChapterMetadata = async (id: string) => {
        const webnovel = webnovels.find((webnovel) => webnovel.id.toString() == id);
        if (webnovel?.chapters) {
            return Promise.resolve(webnovel);
        } else {
            const response = await fetch(`/api/get_webnovel_with_chapter_metadata_by_id?id=${id}`);
            if (!response.ok) {
                console.error("Failed to fetch webnovel by id", response.status);
                return undefined;
            }
            const data = await response.json();
            return data;
        }
    };

    const getWebnovelsMetadataByAuthorId = async (authorId: string) => {
        const filteredWebnovels = webnovels.filter((webnovel) => webnovel.author.id.toString() === authorId);
        if (filteredWebnovels.length > 0) {
            return Promise.resolve(filteredWebnovels);
        } else {
            const response = await fetch(`/api/get_webnovels_metadata_by_author_id?author_id=${authorId}`);
            if (!response.ok) {
                console.error("Failed to fetch webnovels metadata by author id", response.status);
                return [];
            }
            const data = await response.json();
            return data;
        }
        return filteredWebnovels;
    }

    const getWebnovelsMetadataByUserId = async (userId: string) => {
        const filteredWebnovels = webnovels.filter((webnovel) => webnovel.user.id.toString() === userId);
        if (filteredWebnovels.length > 0) {
            return Promise.resolve(filteredWebnovels);
        } else {
            const response = await fetch(`/api/get_webnovels_metadata_by_user_id?user_id=${userId}`);
            if (!response.ok) {
                console.error("Failed to fetch webnovels metadata by user id", response.status);
                return [];
            }
            const data = await response.json();
            return data;
        }
    };

    return (
        <WebnovelsContext.Provider value={{ webnovels, getWebnovelById, getWebnovelIdWithChapterMetadata, getWebnovelsMetadataByUserId, getWebnovelsMetadataByAuthorId, chaptersLikelyNeededWebnovel, invalidateCache, getWebnovelMetadataById }}>
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
