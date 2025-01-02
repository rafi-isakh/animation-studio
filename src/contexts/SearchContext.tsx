"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
    recentQueries: string[];
    setRecentQueries: React.Dispatch<React.SetStateAction<string[]>>;
    lastIndex: number;
    setLastIndex: React.Dispatch<React.SetStateAction<number>>;
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [recentQueries, setRecentQueries] = useState<string[]>([]);
    const [lastIndex, setLastIndex] = useState(0);
    const [query, setQuery] = useState('');
    return (
        <SearchContext.Provider value={{ recentQueries, setRecentQueries, lastIndex, setLastIndex, query, setQuery }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
