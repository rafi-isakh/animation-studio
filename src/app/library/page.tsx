"use client"
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@/contexts/UserContext";
import { phrase } from "@/utils/phrases";
import { useEffect, useState } from "react";
import LibraryComponent from '@/components/LibraryComponent'

const Library = () => {
    const {language, dictionary} = useLanguage();
    const {email} = useUser();
    const [library, setLibrary] = useState<Webnovel[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_library?email=${email}`);
            const data = await response.json();
            setLibrary(data);
        }
        fetchData();
    }, [email])

    return (
        <div className="max-w-screen-xl flex mx-auto justify-center">
            <LibraryComponent library={library}/>
        </div>
    )
}

export default Library;