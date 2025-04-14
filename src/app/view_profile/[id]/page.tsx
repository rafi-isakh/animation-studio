"use client"
import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, UserStripped, Webnovel } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import UserBlockedComponent from '@/components/UserBlockedComponent';
import { useEffect } from 'react';
import { useState } from 'react';

async function getUser(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
        const errorData = await response.json();
        return null;
    }
    const user: UserStripped = await response.json();
    return user;
}

export default function ViewProfile({ params: { id }, }: { params: { id: string } }) {
    const [user, setUser] = useState<UserStripped | null>(null);
    const [novels, setNovels] = useState<Webnovel[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getWebnovelsMetadataByUserId } = useWebnovels();

    useEffect(() => {
        const fetchUserAndNovels = async () => {
            const user = await getUser(id);
            setUser(user);
            if (user) {
                const novels = await getWebnovelsMetadataByUserId(user.id.toString());
                setNovels(novels);
            }
            setIsLoading(false);
        }
        fetchUserAndNovels();
    }, [id]);

    if (isLoading) {
        return null
    }
    if (user && novels) {
        return (
            <ProfileComponent user={user} novels={novels} />
        );
    } else {
        return (
            <EmptyProfileComponent />
        )
    }
}
