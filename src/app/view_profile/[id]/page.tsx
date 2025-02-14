"use client"
import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, Webnovel } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import UserBlockedComponent from '@/components/UserBlockedComponent';
import { useEffect } from 'react';
import { useState } from 'react';

async function getUser(id: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_user_by_id?id=${id}`);
    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        return null;
    }
    const user: User = await response.json();
    return user;
}

export default function ViewProfile({ params: { id }, }: { params: { id: string } }) {
    const [user, setUser] = useState<User | null>(null);
    const [novels, setNovels] = useState<Webnovel[] | null>(null);
    const { getWebnovelsByAuthorEmailHash } = useWebnovels();

    useEffect(() => {
        getUser(id).then(user => {
            setUser(user);
            if (user) {
                setNovels(getWebnovelsByAuthorEmailHash(user.email_hash));
            }
        });
    }, [id]);

    if (!user) {
        return (
            <EmptyProfileComponent />
        )
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
