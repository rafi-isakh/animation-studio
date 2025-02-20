'use client'

import { useUser } from "@/contexts/UserContext"
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import MyReadingListWrapper from '@/components/UI/MyReadingListWrapper';

const MyReadingListComponent = ({ library }: { library: Webnovel[] }) => {
    const { dictionary, language } = useLanguage();
    const { isLoggedIn, email } = useAuth();
    const { nickname } = useUser();

    return (
        isLoggedIn && (
            <div className="md:max-w-screen-xl w-full flex mx-auto justify-center">
                <MyReadingListWrapper library={library} nickname={nickname} />
            </div>
        )
    );
}

export default MyReadingListComponent;