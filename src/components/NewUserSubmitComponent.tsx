"use client"

import { useLanguage } from "@/contexts/LanguageContext"


const NewUserSubmitComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <button
            type="submit"
            className="button-style px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" >
            {Object.keys(dictionary).length != 0 && dictionary["register"][language]}
        </button>
    )
}

export default NewUserSubmitComponent;
