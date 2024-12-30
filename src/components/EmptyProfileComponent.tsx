"use client"

import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";


const EmptyProfileComponent = () => {
    const {dictionary, language} = useLanguage();
    return (
        <div className="max-w-screen-lg flex mx-auto justify-center">
            {phrase(dictionary, "noProfileFound", language)}
        </div>
    )
}

export default EmptyProfileComponent;