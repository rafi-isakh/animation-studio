"use client"

import { useLanguage } from "@/contexts/LanguageContext"

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div>
            <p className="text-lg">{Object.keys(dictionary).length != 0 && dictionary["intro"][language]}</p>
            <textarea
                name="bio"
                rows={4}
                className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
            />
        </div>
    )
}

export default NewUserBioComponent;

