'use client'

import { useUser } from "@/contexts/UserContext"
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import MyReadingListWrapper from '@/components/UI/MyReadingListWrapper';

const MyReadingListComponent = () => {
    const { dictionary, language } = useLanguage();
    const { isLoggedIn } = useAuth();
    const [library, setLibrary] = useState<Webnovel[]>([]);
    const { email, nickname } = useUser();

    useEffect(() => {
        const fetchLibrary = async () => {
            const response = await fetch(`/api/get_library?email=${email}`);
            if (!response.ok) {
                return;
            }
            const data = await response.json();
            setLibrary(data.library);
        }

        if (email && isLoggedIn) {
            fetchLibrary();
        }
    }, [email, isLoggedIn]);


    return (
        isLoggedIn ? (
            <div className="max-w-screen-lg w-full flex mx-auto justify-center">
                <MyReadingListWrapper library={library} nickname={nickname} />
            </div>
        ) : (
            <></>
        )
    );
}

export default MyReadingListComponent;