"use client"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

const Library = () => {
    const {language, dictionary} = useLanguage();
    return (
        <div className="max-w-screen-xl flex mx-auto justify-center">
            {phrase(dictionary, "preparing", language)}
        </div>
    )
}

export default Library;