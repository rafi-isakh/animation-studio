"use client"
import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { UserStripped, Webnovel, Author } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { useEffect } from 'react';
import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import useSWR from 'swr';
import LottieLoader from '@/components/LottieLoader';
import animationData from '@/assets/N_logo_with_heart.json';

const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
    }
    return response.json();
};

export default function ViewAuthor({ params: { id } }: { params: { id: string } }) {
    const { data: novelsData, error: novelsError, isLoading: novelsLoading } = useSWR(
        id ? `${process.env.NEXT_PUBLIC_HOST}/api/get_webnovels_metadata_by_author_id?author_id=${id}` : null,
        fetcher
    );

    const [novels, setNovels] = useState<Webnovel[] | null>(null);
    const [user, setUser] = useState<UserStripped | null>(null);

    useEffect(() => {
        if (novelsData && !novelsError) {
            setNovels(novelsData);
            // Extract author info from the first novel to create user object
            if (novelsData.length > 0 && novelsData[0].author) {
                const authorInfo = novelsData[0].author;
                // Create a UserStripped object from author data
                const userFromAuthor: UserStripped = {
                    id: authorInfo.id,
                    nickname: authorInfo.nickname,
                    bio: '', // Author doesn't have bio, use empty string
                    picture: '', // Author doesn't have picture, use empty string  
                    other_translations: [], // Default empty array
                    is_adult: false // Default false
                };
                setUser(userFromAuthor);
            }
        }
    }, [novelsData, novelsError]);

    if (novelsLoading) {
        return <div role="status" className={`flex items-center justify-center min-h-screen`}>
            <LottieLoader
                animationData={animationData}
                width="w-40"
                centered={true}
                pulseEffect={true}
            />
        </div>;
    }

    if (novelsError) {
        console.error('Error fetching data:', { novelsError });
        return <EmptyProfileComponent />;
    }

    if (user && novels !== null) {
        return (
            <div className="md:max-w-screen-xl w-full mx-auto flex flex-col md:flex-row">
                <div className="flex-1 w-full flex-shrink-0">
                    <ProfileComponent user={user} novels={novels} mode="view_author" />
                </div>
            </div>
        );
    } else {
        return (
            <EmptyProfileComponent />
        )
    }
}
