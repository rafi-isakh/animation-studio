"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";

const NewUserBioComponent = () => {
    const { dictionary, language } = useLanguage();
    const maxText = 500;
    const [currText, setCurrText] = useState(0);
    const [content, setContent] = useState('');

    useEffect(() => {
        setCurrText(content.length);
    }, [content])

    const trim = (text: string) => {
        text = text.substring(0, maxText)
        return text
    }
    
    return (
        <div>
            <p className="text-lg">{phrase(dictionary, "intro", language)}</p>
            <textarea
                name="bio"
                rows={6}
                value={content}
                onChange={(e) => setContent(trim(e.target.value))}
                className='input border-none rounded focus:ring-pink-600 bg-gray-200 w-full'
            />
            <div className='flex justify-end'>
                <p className={`text-sm`}>{`${currText}/${maxText} ${phrase(dictionary, "chars", language)}`}</p>
            </div>
        </div>

    )
}

export default NewUserBioComponent;

