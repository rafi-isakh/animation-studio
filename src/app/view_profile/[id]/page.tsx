"use client"
import EmptyProfileComponent from '@/components/EmptyProfileComponent';
import ProfileComponent from '@/components/ProfileComponent';
import { User, UserStripped, Webnovel } from '@/components/Types';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import UserBlockedComponent from '@/components/UserBlockedComponent';
import { useEffect } from 'react';
import { useState } from 'react';
import PageAsideBar from "@/components/UI/PageAsideBar";


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
            <div className="relative md:max-w-screen-xl w-full mx-auto flex flex-col md:flex-row">
                <PageAsideBar mode="viewProfile" user={user} />
                <div className="flex-1 w-full flex-grow flex-shrink-0">
                    <ProfileComponent user={user} novels={novels} />
                </div>
            </div>
        );
    } else {
        return (
            <EmptyProfileComponent />
        )
    }
}
