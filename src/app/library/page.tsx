"use client"
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { phrase } from "@/utils/phrases";
import { useEffect, useState } from "react";
import LibraryComponent from '@/components/LibraryComponent'

const Library = () => {
    const {email, nickname} = useUser();
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
        <div className="max-w-screen-xl h-full flex mx-auto justify-center mb-72">
            <LibraryComponent library={library} nickname={nickname} loading={loading}/>
            
        </div>
    )
}

export default Library;