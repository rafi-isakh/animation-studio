"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import {phrase} from '@/utils/phrases';

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();

    return (
        <div>
            <p className="text-lg">{phrase(dictionary, "intro", language)}</p>
            <textarea
                name="bio"
                rows={4}
                className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
            />
        </div>
    )
}

export default NewUserBioComponent;

