"use client"
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { phrase } from "@/utils/phrases";
import { useEffect, useState } from "react";
import LibraryComponent from '@/components/LibraryComponent'
import { useAuth } from "@/contexts/AuthContext";

const Library = () => {
    const {language, dictionary} = useLanguage();
    const {email} = useUser();
    const [library, setLibrary] = useState<Webnovel[]>([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const response = await fetch(`/api/get_library`);
            if (!response.ok) {
                return;
            }
            const data = await response.json();
            setLibrary(data.library);
            setLoading(false);
        }
        if (email) {
            fetchData();
        }
    }, [email])

    return (
        <div className="max-w-screen-lg flex mx-auto justify-center">
            <LibraryComponent library={library} loading={loading}/>
        </div>
    )
}

export default Library;