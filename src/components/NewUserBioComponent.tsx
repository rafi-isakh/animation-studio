"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases';
import { useEffect, useState } from "react";
import '@/styles/new_user.css'

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
        <div className='w-full text-black dark:text-black'>
            <textarea
                placeholder={phrase(dictionary, "intro", language)}
                name="bio"
                rows={6}
                value={content}
                onChange={(e) => setContent(trim(e.target.value))}
                className='input rounded-md w-full border border-gray-300 text-black dark:text-black'
            />
        </div>

    )
}

export default NewUserBioComponent;

